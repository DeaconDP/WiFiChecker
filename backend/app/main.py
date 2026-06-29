from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import create_router
from app.config import settings
from app.database import Database
from app.services.monitor_engine import MonitorEngine

db = Database()
engine = MonitorEngine(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await engine.start()
    yield
    await engine.stop()


app = FastAPI(
    title=settings.app_name,
    description="Wi-Fi traffic analysis — greedy devices, greedy processes, anomaly detection.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(create_router(engine), prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
