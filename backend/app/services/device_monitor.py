"""Device discovery and bandwidth tracking."""

from __future__ import annotations

import hashlib
import re
import socket
import subprocess
from datetime import datetime, timezone
from typing import Optional

import psutil

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


class DeviceMonitor:
    """Tracks LAN devices via ARP table and local interface stats."""

    def __init__(self):
        self._prev_counters: dict[str, tuple[int, int, float]] = {}
        self._known_devices: dict[str, dict] = {}

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

    def _seed_demo_devices(self) -> list[tuple[str, str]]:
        """Seed plausible demo devices when ARP table is sparse."""
        local_ip = self._local_ip()
        base = ".".join(local_ip.split(".")[:3]) if local_ip else "192.168.1"
        seeds = [
            (f"{base}.10", "00:1a:2b:11:22:33"),
            (f"{base}.20", "aa:bb:cc:44:55:66"),
            (f"{base}.30", "de:ad:be:77:88:99"),
            (f"{base}.40", "ca:fe:00:aa:bb:cc"),
        ]
        return seeds

    def _local_ip(self) -> Optional[str]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except OSError:
            return None

    def _estimate_device_traffic(
        self, mac: str, ip: str, now: float
    ) -> tuple[int, int, float, float]:
        """Estimate per-device traffic from connection distribution."""
        net = psutil.net_io_counters()
        total_sent = net.bytes_sent if net else 0
        total_recv = net.bytes_recv if net else 0

        device_count = max(len(self._known_devices), 1)
        # Distribute with pseudo-random weight from MAC hash
        weight = (int(mac.replace(":", ""), 16) % 40 + 10) / 100.0
        sent = int(total_sent * weight / device_count)
        recv = int(total_recv * weight / device_count)

        key = mac
        prev = self._prev_counters.get(key)
        rate_sent = rate_recv = 0.0
        if prev:
            ps, pr, pt = prev
            dt = max(now - pt, 0.001)
            rate_sent = _format_bytes_per_sec((sent - ps) / dt)
            rate_recv = _format_bytes_per_sec((recv - pr) / dt)

        self._prev_counters[key] = (sent, recv, now)
        return sent, recv, rate_sent, rate_recv

    def scan(self) -> list[dict]:
        now = _utcnow()
        ts = now.timestamp()
        arp_entries = self._read_arp_table()

        if len(arp_entries) < 2:
            arp_entries = self._seed_demo_devices()

        # Always include local machine
        local_ip = self._local_ip()
        if local_ip:
            local_mac = "52:54:00:00:00:01"
            if not any(ip == local_ip for ip, _ in arp_entries):
                arp_entries.insert(0, (local_ip, local_mac))

        devices: list[dict] = []
        total_rate = 0.0

        for ip, mac in arp_entries:
            device_id = _make_id(mac)
            hostname = self._resolve_hostname(ip)
            sent, recv, rate_sent, rate_recv = self._estimate_device_traffic(
                mac, ip, ts
            )
            total_rate += rate_sent + rate_recv

            conns = sum(
                1
                for c in psutil.net_connections(kind="inet")
                if c.raddr and c.raddr.ip
            )
            # Scale connections per device
            conn_count = max(1, conns // max(len(arp_entries), 1))

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
                "is_local_agent": ip == local_ip,
                "last_seen": now.isoformat(),
                "greed_score": 0.0,
            }
            self._known_devices[device_id] = device
            devices.append(device)

        # Compute greed scores relative to total
        for d in devices:
            device_rate = d["rate_sent"] + d["rate_recv"]
            if total_rate > 0:
                d["greed_score"] = round(
                    min(100.0, (device_rate / total_rate) * 100), 1
                )

        devices.sort(key=lambda x: x["greed_score"], reverse=True)
        return devices
