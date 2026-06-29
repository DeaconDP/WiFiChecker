from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from app.features import FEATURES

router = APIRouter()


class SettingsUpdate(BaseModel):
    anomaly_sigma_threshold: float | None = Field(default=None, ge=1.0, le=5.0)


def create_router(engine) -> APIRouter:
    @router.get("/summary")
    async def get_summary():
        snap = engine.snapshot()
        return snap.get("summary", {})

    @router.get("/devices")
    async def get_devices():
        return engine.snapshot().get("devices", [])

    @router.get("/devices/sparklines")
    async def get_device_sparklines(hours: int = 24):
        devices = engine.snapshot().get("devices", [])
        ids = [d["id"] for d in devices]
        sparklines = await engine.db.get_device_sparklines(ids, hours=hours)
        return sparklines

    @router.get("/settings")
    async def get_settings():
        return await engine.get_settings()

    @router.patch("/settings")
    async def update_settings(body: SettingsUpdate):
        updates = body.model_dump(exclude_none=True)
        return await engine.update_settings(updates)

    @router.get("/processes")
    async def get_processes():
        return engine.snapshot().get("processes", [])

    @router.get("/alerts")
    async def get_alerts():
        return engine.snapshot().get("alerts", [])

    @router.post("/alerts/{alert_id}/acknowledge")
    async def acknowledge_alert(alert_id: str):
        await engine.db.acknowledge_alert(alert_id)
        alerts = await engine.db.list_alerts(50)
        engine._latest["alerts"] = alerts
        return {"ok": True}

    @router.get("/features")
    async def get_features():
        return FEATURES

    @router.get("/roadmap")
    async def get_roadmap():
        content = await engine.db.export_roadmap()
        return {"content": content}

    @router.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        queue = engine.subscribe()
        try:
            await websocket.send_json(engine.snapshot())
            while True:
                payload = await queue.get()
                await websocket.send_json(payload)
        except WebSocketDisconnect:
            pass
        finally:
            engine.unsubscribe(queue)

    return router
