import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .services.mithi_engine import engine
from .routes import health, config, generate, model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mithi_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifespan startup: Trigger asynchronous model initialization in background
    logger.info("Starting Mithi AI Voice Studio backend...")
    engine.initialize_async()
    yield
    # Lifespan shutdown
    logger.info("Shutting down Mithi AI Voice Studio backend...")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="High-performance Text-to-Speech API powered by Mithi v1 Flash for 11 Indian languages.",
    lifespan=lifespan
)

# CORS Middleware - permit all local and packaged origins without credentials conflict
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(health.router)
app.include_router(config.router)
app.include_router(generate.router)
app.include_router(model.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health",
        "config_url": "/api/config"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=False)
