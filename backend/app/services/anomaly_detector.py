"""Baseline learning and anomaly detection."""

from __future__ import annotations

import statistics
import uuid
from datetime import datetime, timezone

from app.config import settings


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class AnomalyDetector:
    def __init__(self, sigma_threshold: float | None = None):
        self.sigma_threshold = sigma_threshold or settings.anomaly_sigma_threshold
        self._rate_history: dict[str, list[float]] = {}
        self._seen_remotes: dict[str, set[str]] = {}
        self._alerted: set[str] = set()

    def _entity_key(self, entity_type: str, entity_id: str) -> str:
        return f"{entity_type}:{entity_id}"

    def record_sample(
        self, entity_type: str, entity_id: str, rate: float
    ) -> None:
        key = self._entity_key(entity_type, entity_id)
        history = self._rate_history.setdefault(key, [])
        history.append(rate)
        # Keep ~7 days at 2s intervals would be huge; cap at 500 samples
        if len(history) > 500:
            self._rate_history[key] = history[-500:]

    def check_device_anomalies(self, devices: list[dict]) -> list[dict]:
        alerts: list[dict] = []
        for d in devices:
            rate = d["rate_sent"] + d["rate_recv"]
            key = self._entity_key("device", d["id"])
            self.record_sample("device", d["id"], rate)

            history = self._rate_history.get(key, [])
            if len(history) < 10:
                continue

            mean = statistics.mean(history)
            stdev = statistics.stdev(history) if len(history) > 1 else 0.0
            threshold = mean + self.sigma_threshold * max(stdev, mean * 0.1)

            if rate > threshold and rate > 50_000:  # > ~50 KB/s
                alert_key = f"greedy:{d['id']}"
                if alert_key not in self._alerted:
                    self._alerted.add(alert_key)
                    alerts.append(
                        self._make_alert(
                            severity="warning",
                            category="greedy_device",
                            title=f"▲ Greedy device: {d['hostname']}",
                            message=(
                                f"{d['hostname']} ({d['ip']}) is using "
                                f"{self._fmt_rate(rate)} — "
                                f"{d['greed_score']:.0f}% of observed traffic."
                            ),
                            explanation=(
                                "This device is sending or receiving significantly "
                                "more data than its recent baseline. This may be a "
                                "large download, cloud backup, or streaming — but "
                                "could also indicate unexpected activity. Check what "
                                "apps are running on this device."
                            ),
                            device_id=d["id"],
                        )
                    )

            # Upload-heavy pattern (potential exfiltration indicator)
            if d["rate_sent"] > 100_000 and d["rate_sent"] > d["rate_recv"] * 3:
                alert_key = f"upload:{d['id']}"
                if alert_key not in self._alerted:
                    self._alerted.add(alert_key)
                    alerts.append(
                        self._make_alert(
                            severity="critical",
                            category="suspicious_upload",
                            title=f"◈ Unusual upload: {d['hostname']}",
                            message=(
                                f"{d['hostname']} is uploading "
                                f"{self._fmt_rate(d['rate_sent'])} with little "
                                "download — an asymmetric pattern."
                            ),
                            explanation=(
                                "Heavy outbound traffic with minimal inbound can "
                                "indicate data exfiltration, cloud sync, or a "
                                "backdoor beacon. Encrypted traffic hides content, "
                                "but volume and direction are still visible. "
                                "Investigate if this device should be uploading now."
                            ),
                            device_id=d["id"],
                        )
                    )

        return alerts

    def check_process_anomalies(self, processes: list[dict]) -> list[dict]:
        alerts: list[dict] = []
        for p in processes:
            rate = p["rate_sent"] + p["rate_recv"]
            key = self._entity_key("process", str(p["pid"]))
            self.record_sample("process", str(p["pid"]), rate)

            history = self._rate_history.get(key, [])
            if len(history) < 10:
                continue

            mean = statistics.mean(history)
            stdev = statistics.stdev(history) if len(history) > 1 else 0.0
            threshold = mean + self.sigma_threshold * max(stdev, mean * 0.1)

            if rate > threshold and rate > 20_000:
                alert_key = f"greedy_proc:{p['pid']}"
                if alert_key not in self._alerted:
                    self._alerted.add(alert_key)
                    alerts.append(
                        self._make_alert(
                            severity="warning",
                            category="greedy_process",
                            title=f"▣ Greedy process: {p['name']}",
                            message=(
                                f"Process '{p['name']}' (PID {p['pid']}) is "
                                f"using {self._fmt_rate(rate)} network I/O."
                            ),
                            explanation=(
                                "This application is using more network bandwidth "
                                "than its recent baseline on this machine. Common "
                                "causes: browser tabs, game launchers, sync clients. "
                                "If you don't recognize this process, investigate "
                                "its executable path and remote connections."
                            ),
                            process_name=p["name"],
                        )
                    )

            # New remote hosts
            proc_key = p["name"]
            known = self._seen_remotes.setdefault(proc_key, set())
            for remote in p.get("remote_hosts", []):
                host = remote.split(":")[0]
                if not host or host in ("127.0.0.1", "0.0.0.0"):
                    continue
                if host not in known:
                    known.add(host)
                    alert_key = f"new_host:{proc_key}:{host}"
                    if alert_key not in self._alerted:
                        self._alerted.add(alert_key)
                        alerts.append(
                            self._make_alert(
                                severity="info",
                                category="new_destination",
                                title=f"◎ New connection: {p['name']} → {host}",
                                message=(
                                    f"'{p['name']}' connected to {host} for the "
                                    "first time this session."
                                ),
                                explanation=(
                                    "Spectra flags destinations your processes "
                                    "haven't contacted before. New connections are "
                                    "normal after updates or first-run — but "
                                    "unexpected hosts warrant a quick check. "
                                    "Cross-reference with a threat intel lookup."
                                ),
                                process_name=p["name"],
                            )
                        )

        return alerts

    def check_new_devices(
        self, devices: list[dict], seen_device_ids: set[str]
    ) -> list[dict]:
        alerts: list[dict] = []
        for d in devices:
            if d["id"] in seen_device_ids:
                continue
            alert_key = f"new_device:{d['id']}"
            if alert_key in self._alerted:
                continue
            self._alerted.add(alert_key)
            alerts.append(
                self._make_alert(
                    severity="info",
                    category="new_device",
                    title=f"◎ New device: {d['hostname']}",
                    message=(
                        f"{d['hostname']} ({d['ip']}, {d['mac']}) joined the network."
                    ),
                    explanation=(
                        "A device with an unknown MAC address appeared on your LAN. "
                        "This is normal when guests connect or you add new hardware — "
                        "but unexpected devices may warrant investigation. "
                        "Check the device vendor and hostname."
                    ),
                    device_id=d["id"],
                )
            )
        return alerts

    def _make_alert(
        self,
        severity: str,
        category: str,
        title: str,
        message: str,
        explanation: str,
        device_id: str | None = None,
        process_name: str | None = None,
    ) -> dict:
        return {
            "id": str(uuid.uuid4())[:12],
            "severity": severity,
            "category": category,
            "title": title,
            "message": message,
            "explanation": explanation,
            "device_id": device_id,
            "process_name": process_name,
            "created_at": _utcnow(),
            "acknowledged": False,
        }

    @staticmethod
    def _fmt_rate(bps: float) -> str:
        if bps >= 1_000_000:
            return f"{bps / 1_000_000:.1f} MB/s"
        if bps >= 1_000:
            return f"{bps / 1_000:.1f} KB/s"
        return f"{bps:.0f} B/s"
