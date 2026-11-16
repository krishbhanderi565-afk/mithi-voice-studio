from fastapi import APIRouter, Response, status
from ..schemas.config import HealthResponse
from ..services.mithi_engine import engine
from ..config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Check backend health and model readiness.
    Returns HTTP 200 with engine state (ok, initializing, or degraded).
    """
    is_ready = engine.is_loaded

    status_str = "ok" if is_ready else ("initializing" if engine.is_loading else "degraded")

    details = {}
    if engine.is_loading:
        details["loading"] = "true"
    if engine.load_error:
        details["error"] = str(engine.load_error)

    return HealthResponse(
        status=status_str,
        model_loaded=is_ready,
        device=engine.device,
        cpu_threads=engine.cpu_threads,
        model_name="mithi-v1-flash",
        model_version=settings.app_version,
        details=details
    )
