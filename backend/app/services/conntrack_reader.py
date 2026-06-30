"""Parse Linux conntrack for per-LAN-IP traffic attribution."""

from __future__ import annotations

import ipaddress
import re
import subprocess
from dataclasses import dataclass, field


@dataclass
class IpTrafficStats:
    bytes_sent: int = 0
    bytes_recv: int = 0
    connection_count: int = 0


@dataclass
class ConntrackSnapshot:
    by_ip: dict[str, IpTrafficStats] = field(default_factory=dict)
    entry_count: int = 0
    source: str = "none"


_SRC_RE = re.compile(r"\bsrc=([0-9a-fA-F:.]+)")
_BYTES_RE = re.compile(r"\bbytes=(\d+)")


def is_private_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return addr.is_private or addr.is_link_local


def _lan_prefix(local_ip: str | None) -> str | None:
    if not local_ip:
        return None
    parts = local_ip.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3])
    return None


def is_lan_ip(ip: str, local_ip: str | None = None) -> bool:
    if not is_private_ip(ip):
        return False
    prefix = _lan_prefix(local_ip)
    if prefix and ip.startswith(f"{prefix}."):
        return True
    return is_private_ip(ip)


def parse_conntrack_line(line: str) -> tuple[str, int, int] | None:
    """Return (lan_ip, bytes_sent, bytes_recv) for one conntrack entry."""
    srcs = _SRC_RE.findall(line)
    byte_vals = [int(v) for v in _BYTES_RE.findall(line)]
    if not srcs or not byte_vals:
        return None

    orig_src = srcs[0]
    orig_bytes = byte_vals[0]
    reply_bytes = byte_vals[1] if len(byte_vals) > 1 else 0

    if is_private_ip(orig_src):
        return orig_src, orig_bytes, reply_bytes

    if len(srcs) > 1:
        reply_src = srcs[1]
        if is_private_ip(reply_src):
            return reply_src, reply_bytes, orig_bytes

    return None


def aggregate_conntrack_lines(lines: list[str]) -> dict[str, IpTrafficStats]:
    stats: dict[str, IpTrafficStats] = {}
    for line in lines:
        parsed = parse_conntrack_line(line.strip())
        if not parsed:
            continue
        ip, sent, recv = parsed
        entry = stats.setdefault(ip, IpTrafficStats())
        entry.bytes_sent += sent
        entry.bytes_recv += recv
        entry.connection_count += 1
    return stats


def _read_proc_conntrack() -> list[str]:
    for path in ("/proc/net/nf_conntrack", "/proc/net/ip_conntrack"):
        try:
            with open(path) as handle:
                lines = [line for line in handle if line.strip()]
            if lines:
                return lines
        except OSError:
            continue
    return []


def _read_conntrack_cli() -> list[str]:
    try:
        result = subprocess.run(
            ["conntrack", "-L", "-o", "extended"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.splitlines()
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return []


def read_conntrack_snapshot() -> ConntrackSnapshot:
    lines = _read_proc_conntrack()
    source = "proc"
    if not lines:
        lines = _read_conntrack_cli()
        source = "cli" if lines else "none"

    by_ip = aggregate_conntrack_lines(lines)
    return ConntrackSnapshot(by_ip=by_ip, entry_count=len(lines), source=source)
