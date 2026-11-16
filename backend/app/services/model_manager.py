import os
import sys
import shutil
import threading
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from huggingface_hub import snapshot_download

from ..config import settings
from ..utils.paths import verify_model_integrity

logger = logging.getLogger("model_manager")

MODEL_REPO_ID = "Oomni/mithi-v1-flash"
APPROX_DOWNLOAD_BYTES = 250_000_000  # ~239 MB

class ModelManager:
    _instance: Optional["ModelManager"] = None
    _lock = threading.Lock()

    def __init__(self):
        self.status = "idle"  # idle, checking, downloading, verifying, ready, error
        self.progress_percent = 0.0
        self.downloaded_bytes = 0
        self.total_bytes = APPROX_DOWNLOAD_BYTES
        self.error_message: Optional[str] = None
        self._thread: Optional[threading.Thread] = None

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def get_status(self) -> Dict[str, Any]:
        model_path = Path(settings.model_dir).resolve()
        is_valid, missing, files = verify_model_integrity(model_path)

        # Check free disk space
        free_bytes = 0
        try:
            target_dir = model_path if model_path.exists() else model_path.parent
            target_dir.mkdir(parents=True, exist_ok=True)
            usage = shutil.disk_usage(str(target_dir))
            free_bytes = usage.free
        except Exception:
            pass

        return {
            "is_installed": is_valid,
            "model_path": str(model_path),
            "missing_files": missing,
            "status": "ready" if is_valid else self.status,
            "progress_percent": 100.0 if is_valid else self.progress_percent,
            "total_bytes": self.total_bytes,
            "downloaded_bytes": self.total_bytes if is_valid else self.downloaded_bytes,
            "free_disk_bytes": free_bytes,
            "free_disk_mb": round(free_bytes / (1024 * 1024), 1),
            "error": self.error_message,
        }

    def start_download(self) -> bool:
        """Start background download of Mithi v1 Flash if not already downloading."""
        with self._lock:
            if self.status == "downloading":
                return False

            self.status = "downloading"
            self.progress_percent = 5.0
            self.error_message = None

            self._thread = threading.Thread(target=self._run_download, daemon=True)
            self._thread.start()
            return True

    def _run_download(self):
        model_path = Path(settings.model_dir).resolve()
        try:
            logger.info(f"Starting model download for {MODEL_REPO_ID} to {model_path}...")
            model_path.mkdir(parents=True, exist_ok=True)

            self.progress_percent = 15.0

            # First check if local valid weights exist to reuse them
            local_seed = None
            for candidate in [
                Path.cwd() / "backend" / "mithi-v1-flash",
                Path.cwd() / "mithi-v1-flash",
                Path(__file__).resolve().parent.parent.parent / "mithi-v1-flash",
                Path(__file__).resolve().parent.parent.parent / "backend" / "mithi-v1-flash",
            ]:
                if candidate.exists():
                    valid, _, _ = verify_model_integrity(candidate)
                    if valid and candidate.resolve() != model_path.resolve():
                        local_seed = candidate
                        break

            if local_seed:
                logger.info(f"Reusing existing valid weights from {local_seed} -> {model_path}")
                self.progress_percent = 25.0
                shutil.copytree(str(local_seed), str(model_path), dirs_exist_ok=True)
                self.progress_percent = 85.0
            else:
                # Execute snapshot download from Hugging Face
                snapshot_download(
                    repo_id=MODEL_REPO_ID,
                    local_dir=str(model_path),
                    local_dir_use_symlinks=False,
                    resume_download=True,
                )

            self.status = "verifying"
            self.progress_percent = 90.0

            is_valid, missing, _ = verify_model_integrity(model_path)
            if not is_valid:
                raise RuntimeError(f"Model download completed but missing required files: {missing}")

            self.status = "ready"
            self.progress_percent = 100.0
            self.downloaded_bytes = self.total_bytes
            logger.info("Model download and verification succeeded.")

        except Exception as e:
            logger.exception("Model download failed.")
            self.status = "error"
            self.error_message = f"Download failed: {str(e)}"

model_manager = ModelManager.get_instance()
