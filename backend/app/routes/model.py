from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..services.model_manager import model_manager
from ..services.mithi_engine import engine
from ..config import settings

router = APIRouter(prefix="/api/model", tags=["Model Management"])

class ModelStatusResponse(BaseModel):
    is_installed: bool
    is_loaded: bool
    model_path: str
    missing_files: List[str]
    status: str
    progress_percent: float
    total_bytes: int
    downloaded_bytes: int
    free_disk_mb: float
    error: Optional[str] = None

@router.get("/status", response_model=ModelStatusResponse)
def get_model_status():
    """Check current model installation, integrity, and memory readiness."""
    status_dict = model_manager.get_status()
    return ModelStatusResponse(
        is_installed=status_dict["is_installed"],
        is_loaded=engine.is_loaded,
        model_path=status_dict["model_path"],
        missing_files=status_dict["missing_files"],
        status="loaded" if engine.is_loaded else status_dict["status"],
        progress_percent=status_dict["progress_percent"],
        total_bytes=status_dict["total_bytes"],
        downloaded_bytes=status_dict["downloaded_bytes"],
        free_disk_mb=status_dict["free_disk_mb"],
        error=status_dict["error"],
    )

@router.post("/download")
def download_model():
    """Trigger background download of Mithi v1 Flash model weights."""
    current_status = model_manager.get_status()
    if current_status["is_installed"]:
        return {"message": "Model is already installed and verified.", "status": "ready"}

    started = model_manager.start_download()
    if not started:
        return {"message": "Model download already in progress.", "status": "downloading"}

    return {"message": "Model download started.", "status": "downloading"}

@router.post("/initialize")
def initialize_model():
    """Load model weights into memory once installed."""
    current_status = model_manager.get_status()
    if not current_status["is_installed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model files not complete. Missing: {current_status['missing_files']}"
        )

    engine.initialize()
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model initialization failed: {engine.load_error}"
        )

    return {"message": "Mithi v1 Flash model loaded successfully into memory.", "model_loaded": True}
