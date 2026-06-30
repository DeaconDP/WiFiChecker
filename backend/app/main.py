from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

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


def _frontend_dist() -> Path:
    return Path(settings.frontend_dist)


def _serve_frontend(path: str) -> FileResponse:
    dist = _frontend_dist()
    if not dist.is_dir():
        raise HTTPException(
            status_code=503,
            detail="Frontend not built. Run launch.py or npm run build.",
        )

    if path:
        file_path = (dist / path).resolve()
        if not str(file_path).startswith(str(dist.resolve())):
            raise HTTPException(status_code=404)
        if file_path.is_file():
            return FileResponse(file_path)

    index = dist / "index.html"
    if index.is_file():
        return FileResponse(index)

    raise HTTPException(
        status_code=503,
        detail="Frontend not built. Run launch.py or npm run build.",
    )


@app.get("/")
async def root():
    return _serve_frontend("")


if _frontend_dist().is_dir():

    @app.get("/{path:path}")
    async def frontend_assets(path: str):
        if path.startswith("api/") or path == "api":
            raise HTTPException(status_code=404)
        return _serve_frontend(path)
