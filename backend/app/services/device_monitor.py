"""Device discovery and bandwidth tracking."""

from __future__ import annotations

import hashlib
import re
import socket
import subprocess
import uuid
from datetime import datetime, timezone
from typing import Optional

import psutil

from app.services.conntrack_reader import (
    ConntrackSnapshot,
    is_lan_ip,
    read_conntrack_snapshot,
)

# Common OUI prefixes for demo labeling
VENDOR_OUI: dict[str, str] = {
    "00:1A:2B": "Apple",
    "AA:BB:CC": "Samsung",
    "DE:AD:BE": "Google",
    "CA:FE:00": "Amazon",
    "B8:27:EB": "Raspberry Pi",
    "DC:A6:32": "Raspberry Pi",
    "52:54:00": "QEMU/KVM",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _format_bytes_per_sec(rate: float) -> float:
    return round(rate, 2)


def _oui_vendor(mac: str) -> str:
    prefix = mac.upper()[:8]
    return VENDOR_OUI.get(prefix, "Unknown")


def _make_id(mac: str) -> str:
    return hashlib.sha256(mac.encode()).hexdigest()[:12]


def _local_mac() -> str:
    node = uuid.getnode()
    return ":".join(f"{(node >> shift) & 0xFF:02x}" for shift in range(40, -1, -8))


class DeviceMonitor:
    """Tracks LAN devices via ARP table and real traffic sources."""

    def __init__(self):
        self._prev_counters: dict[str, tuple[int, int, float]] = {}
        self._known_devices: dict[str, dict] = {}
        self._conntrack_available = False

    def _read_arp_table(self) -> list[tuple[str, str]]:
        """Parse system ARP/neighbor table for IP + MAC pairs."""
        entries: list[tuple[str, str]] = []
        try:
            with open("/proc/net/arp") as f:
                lines = f.readlines()[1:]
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 4 and parts[3] != "00:00:00:00:00:00":
                        ip, mac = parts[0], parts[3].lower()
                        if re.match(r"^([0-9a-f]{2}:){5}[0-9a-f]{2}$", mac):
                            entries.append((ip, mac))
        except FileNotFoundError:
            pass

        if not entries:
            try:
                result = subprocess.run(
                    ["ip", "neigh", "show"],
                    capture_output=True,
                    text=True,
                    timeout=3,
                )
                for line in result.stdout.splitlines():
                    match = re.match(
                        r"(\d+\.\d+\.\d+\.\d+)\s+dev\s+\S+\s+lladdr\s+"
                        r"([0-9a-f:]{17})",
                        line,
                        re.I,
                    )
                    if match:
                        entries.append((match.group(1), match.group(2).lower()))
            except (FileNotFoundError, subprocess.TimeoutExpired):
                pass

        return entries

    def _resolve_hostname(self, ip: str) -> str:
        try:
            host, _, _ = socket.gethostbyaddr(ip)
            return host.split(".")[0]
        except (socket.herror, socket.gaierror, OSError):
            return f"host-{ip.split('.')[-1]}"

    def _local_ip(self) -> Optional[str]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except OSError:
            return None

    def _local_interface_counters(self) -> tuple[int, int]:
        net = psutil.net_io_counters()
        if not net:
            return 0, 0
        return net.bytes_sent, net.bytes_recv

    def _local_connection_count(self, local_ip: str | None) -> int:
        if not local_ip:
            return 0
        try:
            connections = psutil.net_connections(kind="inet")
        except (psutil.AccessDenied, PermissionError):
            return 0

        count = 0
        for conn in connections:
            if conn.status != psutil.CONN_ESTABLISHED:
                continue
            if conn.laddr and conn.laddr.ip == local_ip:
                count += 1
        return count

    def _rates_from_counters(
        self, key: str, sent: int, recv: int, ts: float
    ) -> tuple[float, float]:
        prev = self._prev_counters.get(key)
        rate_sent = rate_recv = 0.0
        if prev:
            ps, pr, pt = prev
            dt = max(ts - pt, 0.001)
            rate_sent = _format_bytes_per_sec((sent - ps) / dt)
            rate_recv = _format_bytes_per_sec((recv - pr) / dt)
        self._prev_counters[key] = (sent, recv, ts)
        return rate_sent, rate_recv

    def _metered_traffic(
        self,
        ip: str,
        is_local_agent: bool,
        conntrack: ConntrackSnapshot,
        local_ip: str | None,
        ts: float,
    ) -> tuple[int, int, float, float, int, str]:
        ct_stats = conntrack.by_ip.get(ip)
        if ct_stats and (ct_stats.bytes_sent or ct_stats.bytes_recv):
            rate_sent, rate_recv = self._rates_from_counters(
                f"ct:{ip}", ct_stats.bytes_sent, ct_stats.bytes_recv, ts
            )
            return (
                ct_stats.bytes_sent,
                ct_stats.bytes_recv,
                rate_sent,
                rate_recv,
                ct_stats.connection_count,
                "conntrack",
            )

        if is_local_agent:
            sent, recv = self._local_interface_counters()
            rate_sent, rate_recv = self._rates_from_counters(
                f"local:{ip}", sent, recv, ts
            )
            return (
                sent,
                recv,
                rate_sent,
                rate_recv,
                self._local_connection_count(local_ip),
                "local_agent",
            )

        return 0, 0, 0.0, 0.0, 0, "unmetered"

    def scan(self) -> list[dict]:
        now = _utcnow()
        ts = now.timestamp()
        arp_entries = self._read_arp_table()
        local_ip = self._local_ip()
        local_mac = _local_mac()

        if local_ip and not any(ip == local_ip for ip, _ in arp_entries):
            arp_entries.insert(0, (local_ip, local_mac))

        conntrack = read_conntrack_snapshot()
        self._conntrack_available = conntrack.entry_count > 0

        devices: list[dict] = []
        metered_rate_total = 0.0

        for ip, mac in arp_entries:
            device_id = _make_id(mac)
            hostname = self._resolve_hostname(ip)
            is_local = ip == local_ip

            sent, recv, rate_sent, rate_recv, conn_count, metering_source = (
                self._metered_traffic(ip, is_local, conntrack, local_ip, ts)
            )

            if metering_source == "unmetered" and is_lan_ip(ip, local_ip):
                # Keep inventory visible even when bytes cannot be measured yet.
                conn_count = 0

            device = {
                "id": device_id,
                "mac": mac,
                "ip": ip,
                "hostname": hostname,
                "vendor": _oui_vendor(mac),
                "bytes_sent": sent,
                "bytes_recv": recv,
                "rate_sent": rate_sent,
                "rate_recv": rate_recv,
                "connection_count": conn_count,
                "is_local_agent": is_local,
                "metering_source": metering_source,
                "last_seen": now.isoformat(),
                "greed_score": 0.0,
            }
            self._known_devices[device_id] = device
            devices.append(device)

            if metering_source != "unmetered":
                metered_rate_total += rate_sent + rate_recv

        for d in devices:
            if d["metering_source"] == "unmetered":
                continue
            device_rate = d["rate_sent"] + d["rate_recv"]
            if metered_rate_total > 0:
                d["greed_score"] = round(
                    min(100.0, (device_rate / metered_rate_total) * 100), 1
                )

        devices.sort(
            key=lambda x: (x["metering_source"] == "unmetered", -x["greed_score"])
        )
        return devices
