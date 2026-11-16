import os
from pathlib import Path
from pydantic import BaseModel
from .utils.paths import get_default_model_dir, get_mavs_data_dir

class Settings(BaseModel):
    app_name: str = "MAVS — Mithi AI Voice Studio"
    app_version: str = "1.0.1"
    data_dir: str = str(get_mavs_data_dir())
    model_dir: str = os.getenv("MITHI_MODEL_DIR", str(get_default_model_dir()))
    cpu_threads: int = int(os.getenv("MITHI_CPU_THREADS", "4"))
    device: str = os.getenv("MITHI_DEVICE", "cpu")
    max_text_length: int = int(os.getenv("MAX_TEXT_LENGTH", "1000000"))
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
