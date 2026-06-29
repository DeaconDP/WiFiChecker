"""Per-process network traffic attribution on the local host."""

from __future__ import annotations

import os
from datetime import datetime, timezone

import psutil


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProcessMonitor:
  def __init__(self):
    self._prev: dict[int, tuple[int, int, float]] = {}
    self._seen_remotes: set[str] = set()

  def scan(self) -> list[dict]:
    now = _utcnow()
    ts = now.timestamp()
    processes: dict[int, dict] = {}

    try:
      connections = psutil.net_connections(kind="inet")
    except (psutil.AccessDenied, PermissionError):
      connections = []

    for conn in connections:
      if conn.status != psutil.CONN_ESTABLISHED:
        continue
      if not conn.raddr:
        continue

      pid = conn.pid or 0
      if pid not in processes:
        try:
          proc = psutil.Process(pid) if pid else None
          name = proc.name() if proc else "unknown"
          exe = proc.exe() if proc else None
        except (psutil.NoSuchProcess, psutil.AccessDenied):
          name = f"pid-{pid}"
          exe = None

        processes[pid] = {
          "pid": pid,
          "name": name,
          "exe": exe,
          "bytes_sent": 0,
          "bytes_recv": 0,
          "rate_sent": 0.0,
          "rate_recv": 0.0,
          "connection_count": 0,
          "remote_hosts": [],
          "greed_score": 0.0,
        }

      p = processes[pid]
      p["connection_count"] += 1
      remote = f"{conn.raddr.ip}:{conn.raddr.port}"
      if remote not in p["remote_hosts"]:
        p["remote_hosts"].append(remote)

    # Attribute IO counters from process IO if available
    for pid, p in processes.items():
      if pid == 0:
        continue
      try:
        proc = psutil.Process(pid)
        io = proc.io_counters()
        sent = getattr(io, "write_bytes", 0)
        recv = getattr(io, "read_bytes", 0)
      except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
        sent = recv = 0

      p["bytes_sent"] = sent
      p["bytes_recv"] = recv

      prev = self._prev.get(pid)
      if prev:
        ps, pr, pt = prev
        dt = max(ts - pt, 0.001)
        p["rate_sent"] = round((sent - ps) / dt, 2)
        p["rate_recv"] = round((recv - pr) / dt, 2)
      self._prev[pid] = (sent, recv, ts)

    result = list(processes.values())
    total_rate = sum(p["rate_sent"] + p["rate_recv"] for p in result) or 1.0

    for p in result:
      rate = p["rate_sent"] + p["rate_recv"]
      p["greed_score"] = round(min(100.0, (rate / total_rate) * 100), 1)
      p["remote_hosts"] = p["remote_hosts"][:10]

    result.sort(key=lambda x: x["greed_score"], reverse=True)
    return result[:30]

  def new_remote_hosts(self) -> list[str]:
    """Return remote hosts seen for the first time this session."""
    current: set[str] = set()
    for p in self.scan():
      for host in p["remote_hosts"]:
        current.add(host.split(":")[0])

    new_hosts = current - self._seen_remotes
    self._seen_remotes.update(current)
    return list(new_hosts)
