import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

REQUIRED_MODEL_FILES = [
    "config.json",
    "decoder.safetensors",
    "kokoro_config.json",
    "voices.safetensors",
    "writer.safetensors",
    "indic_encoder/config.json",
    "indic_encoder/model.safetensors",
    "indic_encoder/old2new.npy",
    "indic_encoder/spiece.model",
    "mithi_tts/__init__.py",
]

def get_mavs_data_dir() -> Path:
    """Return OS-appropriate user application data directory for MAVS."""
    if os.getenv("MAVS_DATA_DIR"):
        return Path(os.getenv("MAVS_DATA_DIR")).resolve()

    if sys.platform == "win32":
        app_data = os.getenv("APPDATA") or str(Path.home() / "AppData" / "Roaming")
        return Path(app_data) / "MAVS"
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "MAVS"
    else:
        # Linux and other Unix-like systems (XDG Base Directory Specification)
        xdg_data = os.getenv("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
        return Path(xdg_data) / "MAVS"

def get_default_model_dir() -> Path:
    """Resolve the model directory path with priority:
    1. Environment variable MITHI_MODEL_DIR
    2. Local development folder (backend/mithi-v1-flash) if it exists
    3. OS user data directory: <MAVS_DATA_DIR>/models/mithi-v1-flash
    """
    if os.getenv("MITHI_MODEL_DIR"):
        return Path(os.getenv("MITHI_MODEL_DIR")).resolve()

    # Check for local dev folder in repo
    project_root = Path(__file__).resolve().parent.parent.parent
    local_dev_dir = project_root / "mithi-v1-flash"
    if local_dev_dir.is_dir() and (local_dev_dir / "decoder.safetensors").exists():
        return local_dev_dir

    backend_dev_dir = project_root / "backend" / "mithi-v1-flash"
    if backend_dev_dir.is_dir() and (backend_dev_dir / "decoder.safetensors").exists():
        return backend_dev_dir

    # Standard desktop user data directory
    return get_mavs_data_dir() / "models" / "mithi-v1-flash"

def verify_model_integrity(model_dir: Path) -> Tuple[bool, List[str], Dict[str, bool]]:
    """Check whether all mandatory Mithi v1 Flash files exist and are non-empty.
    Returns:
        (is_valid, missing_files, file_status_dict)
    """
    if not model_dir.exists() or not model_dir.is_dir():
        return False, REQUIRED_MODEL_FILES, {f: False for f in REQUIRED_MODEL_FILES}

    file_status: Dict[str, bool] = {}
    missing: List[str] = []

    for rel_path in REQUIRED_MODEL_FILES:
        target = model_dir / rel_path
        exists_and_valid = target.exists() and target.is_file() and target.stat().st_size > 0
        file_status[rel_path] = exists_and_valid
        if not exists_and_valid:
            missing.append(rel_path)

    is_complete = len(missing) == 0
    return is_complete, missing, file_status
