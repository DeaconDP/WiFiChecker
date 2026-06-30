from pathlib import Path

from pydantic_settings import BaseSettings

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    app_name: str = "Spectra"
    database_path: str = "data/spectra.db"
    poll_interval_seconds: float = 2.0
    baseline_days: int = 7
    anomaly_sigma_threshold: float = 2.5
    host: str = "127.0.0.1"
    port: int = 8000
    frontend_dist: Path = _REPO_ROOT / "frontend" / "dist"

    class Config:
        env_prefix = "SPECTRA_"


settings = Settings()
