"""Background polling engine that ties monitors together."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.config import settings
from app.database import Database
from app.services.anomaly_detector import AnomalyDetector
from app.services.device_monitor import DeviceMonitor
from app.services.process_monitor import ProcessMonitor


class MonitorEngine:
    def __init__(self, db: Database):
        self.db = db
        self.devices = DeviceMonitor()
        self.processes = ProcessMonitor()
        self.anomaly = AnomalyDetector()
        self._task: asyncio.Task | None = None
        self._subscribers: list[asyncio.Queue] = []
        self._seen_device_ids: set[str] = set()
        self._first_tick_done = False
        self._latest: dict = {
            "devices": [],
            "processes": [],
            "alerts": [],
            "summary": {},
        }

    async def start(self) -> None:
        started = await self.db.get_meta("monitoring_since")
        if not started:
            await self.db.set_meta(
                "monitoring_since", datetime.now(timezone.utc).isoformat()
            )
        stored_sigma = await self.db.get_meta("anomaly_sigma_threshold")
        if stored_sigma:
            try:
                self.anomaly.sigma_threshold = float(stored_sigma)
            except ValueError:
                pass
        existing = await self.db.list_devices()
        self._seen_device_ids = {d["id"] for d in existing}
        self._task = asyncio.create_task(self._poll_loop())

    async def get_settings(self) -> dict:
        return {
            "poll_interval_seconds": settings.poll_interval_seconds,
            "anomaly_sigma_threshold": self.anomaly.sigma_threshold,
            "baseline_days": settings.baseline_days,
            "database_path": settings.database_path,
        }

    async def update_settings(self, updates: dict) -> dict:
        if "anomaly_sigma_threshold" in updates:
            value = float(updates["anomaly_sigma_threshold"])
            value = max(1.0, min(5.0, value))
            self.anomaly.sigma_threshold = value
            await self.db.set_meta("anomaly_sigma_threshold", str(value))
        return await self.get_settings()

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=10)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def _broadcast(self, payload: dict) -> None:
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass

    async def _poll_loop(self) -> None:
        while True:
            try:
                await self._tick()
            except Exception:
                pass
            await asyncio.sleep(settings.poll_interval_seconds)

    async def _tick(self) -> None:
        device_list = self.devices.scan()
        process_list = self.processes.scan()

        for d in device_list:
            await self.db.upsert_device(d)
            await self.db.insert_traffic_sample(
                "device", d["id"], d["bytes_sent"], d["bytes_recv"]
            )

        new_device_alerts: list[dict] = []
        if self._first_tick_done:
            new_device_alerts = self.anomaly.check_new_devices(
                device_list, self._seen_device_ids
            )
        for d in device_list:
            self._seen_device_ids.add(d["id"])

        device_alerts = self.anomaly.check_device_anomalies(device_list)
        process_alerts = self.anomaly.check_process_anomalies(process_list)

        for alert in new_device_alerts + device_alerts + process_alerts:
            await self.db.insert_alert(alert)

        alerts = await self.db.list_alerts(50)
        monitoring_since = await self.db.get_meta("monitoring_since")

        total_rate_sent = sum(d["rate_sent"] for d in device_list)
        total_rate_recv = sum(d["rate_recv"] for d in device_list)
        critical = sum(1 for a in alerts if a["severity"] == "critical")

        summary = {
            "total_devices": len(device_list),
            "active_devices": len(device_list),
            "total_rate_sent": round(total_rate_sent, 2),
            "total_rate_recv": round(total_rate_recv, 2),
            "alert_count": len(alerts),
            "critical_alert_count": critical,
            "monitoring_since": monitoring_since,
        }

        self._latest = {
            "devices": device_list,
            "processes": process_list,
            "alerts": alerts,
            "summary": summary,
        }

        await self._broadcast(self._latest)
        self._first_tick_done = True

    def snapshot(self) -> dict:
        return self._latest
