from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Spectra"
    database_path: str = "data/spectra.db"
    poll_interval_seconds: float = 2.0
    baseline_days: int = 7
    anomaly_sigma_threshold: float = 2.5

    class Config:
        env_prefix = "SPECTRA_"


settings = Settings()
