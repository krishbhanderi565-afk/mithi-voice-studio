import io
import os
import sys
import time
import logging
import asyncio
import threading
from typing import Optional, Tuple
import numpy as np
import torch
import soundfile as sf

from ..config import settings

logger = logging.getLogger("mithi_engine")

# Verified constants from official model repository
SAMPLE_RATE = 24000

VERIFIED_LANGUAGES = {
    "hi": {"name": "Hindi", "native_name": "हिन्दी"},
    "en": {"name": "English", "native_name": "English"},
    "bn": {"name": "Bengali", "native_name": "বাংলা"},
    "gu": {"name": "Gujarati", "native_name": "ગુજરાતી"},
    "kn": {"name": "Kannada", "native_name": "ಕನ್ನಡ"},
    "ml": {"name": "Malayalam", "native_name": "മലയാളം"},
    "mr": {"name": "Marathi", "native_name": "मराठी"},
    "or": {"name": "Odia", "native_name": "ଓଡ଼ିଆ"},
    "pa": {"name": "Punjabi", "native_name": "ਪੰਜਾਬੀ"},
    "ta": {"name": "Tamil", "native_name": "தமிழ்"},
    "te": {"name": "Telugu", "native_name": "తెలుగు"}
}

VERIFIED_VOICES = {
    "satvik": {"name": "Satvik", "gender": "Male", "description": "Natural, clear male voice"},
    "charvi": {"name": "Charvi", "gender": "Female", "description": "Expressive, pleasant female voice"}
}

class MithiEngine:
    _instance: Optional["MithiEngine"] = None
    _lock = asyncio.Lock()
    _init_lock = threading.Lock()
    _init_event = threading.Event()

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.is_loading = False
        self.load_error: Optional[str] = None
        self.device = self._resolve_device()
        self.cpu_threads = settings.cpu_threads

    @classmethod
    def get_instance(cls) -> "MithiEngine":
        if cls._instance is None:
            cls._instance = MithiEngine()
        return cls._instance

    def _resolve_device(self) -> str:
        """Resolve optimal inference device with safe fallback."""
        env_dev = os.getenv("MITHI_DEVICE")
        if env_dev:
            return env_dev.lower().strip()

        # Check for Apple Silicon Metal Performance Shaders (MPS)
        if sys.platform == "darwin" and hasattr(torch.backends, "mps"):
            if torch.backends.mps.is_available() and torch.backends.mps.is_built():
                try:
                    # Verify tensor allocation succeeds on MPS
                    test_tensor = torch.zeros(1, device="mps")
                    del test_tensor
                    logger.info("Apple Silicon MPS acceleration available and verified.")
                    return "mps"
                except Exception as mps_err:
                    logger.warning(f"MPS detected but allocation test failed ({mps_err}). Falling back to CPU.")
                    return "cpu"

        # Check for NVIDIA CUDA
        if torch.cuda.is_available():
            logger.info("NVIDIA CUDA acceleration available.")
            return "cuda"

        return "cpu"

    def initialize_async(self):
        """Start model loading in a background daemon thread so HTTP server starts instantly."""
        if self.is_loaded or self.is_loading:
            return

        model_path = os.path.abspath(settings.model_dir)
        if not os.path.exists(model_path):
            self.load_error = f"Model directory not found at: {model_path}"
            return

        thread = threading.Thread(target=self.initialize, daemon=True, name="mithi-model-loader")
        thread.start()

    def initialize(self):
        """Load Mithi model into memory once."""
        if self.is_loaded:
            return

        with self._init_lock:
            if self.is_loaded:
                return

            self.is_loading = True
            self._init_event.clear()
            model_path = os.path.abspath(settings.model_dir)
            logger.info(f"Initializing Mithi v1 Flash from: {model_path}")

            if not os.path.exists(model_path):
                self.load_error = f"Model directory not found at: {model_path}"
                self.is_loading = False
                self._init_event.set()
                logger.error(self.load_error)
                return

            try:
                # Re-verify optimal device
                self.device = self._resolve_device()

                # Configure CPU threads if using CPU
                if self.device == "cpu":
                    threads = self.cpu_threads
                    if threads <= 0:
                        threads = min(os.cpu_count() or 4, 8)
                    torch.set_num_threads(threads)
                    self.cpu_threads = threads
                    logger.info(f"PyTorch CPU threads configured to: {self.cpu_threads}")

                # Ensure model directory is on sys.path so mithi_tts can be imported
                if model_path not in sys.path:
                    sys.path.insert(0, model_path)

                from mithi_tts import Mithi  # type: ignore

                start_time = time.time()
                try:
                    self.model = Mithi(model_dir=model_path, device=self.device)
                except Exception as dev_err:
                    if self.device != "cpu":
                        logger.warning(f"Failed to load on {self.device} ({dev_err}). Falling back to CPU.")
                        self.device = "cpu"
                        threads = min(os.cpu_count() or 4, 8)
                        torch.set_num_threads(threads)
                        self.cpu_threads = threads
                        self.model = Mithi(model_dir=model_path, device="cpu")
                    else:
                        raise dev_err

                load_duration = time.time() - start_time
                self.is_loaded = True
                self.is_loading = False
                self.load_error = None
                self._init_event.set()
                logger.info(f"Mithi v1 Flash loaded successfully in {load_duration:.2f}s on {self.device}")

            except Exception as e:
                self.is_loaded = False
                self.is_loading = False
                self.load_error = f"Failed to load Mithi v1 Flash: {str(e)}"
                self._init_event.set()
                logger.exception(self.load_error)

    def ensure_loaded(self, timeout_sec: float = 60.0) -> bool:
        """Wait for background model loading to complete, or initiate loading if idle."""
        if self.is_loaded and self.model is not None:
            return True

        if not self.is_loading:
            self.initialize()
            return self.is_loaded

        # Wait for the background initialization event
        finished = self._init_event.wait(timeout=timeout_sec)
        return finished and self.is_loaded and self.model is not None

    async def synthesize(self, text: str, lang: str = "en", voice: str = "satvik", seed: Optional[int] = None) -> Tuple[bytes, float]:
        """Synthesize text into WAV audio bytes.
        
        Returns:
            Tuple[bytes, float]: (wav_bytes, duration_seconds)
        """
        if not self.is_loaded or self.model is None:
            if self.is_loading:
                loop = asyncio.get_running_loop()
                ready = await loop.run_in_executor(None, lambda: self.ensure_loaded(60.0))
                if not ready:
                    raise RuntimeError(f"Mithi model loading timed out or failed: {self.load_error or 'Not ready'}")
            else:
                raise RuntimeError(f"Mithi model is not ready: {self.load_error or 'Not initialized'}")

        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Input text cannot be empty or only whitespace.")

        if lang not in VERIFIED_LANGUAGES:
            raise ValueError(f"Language '{lang}' is not supported. Supported: {list(VERIFIED_LANGUAGES.keys())}")

        if voice not in VERIFIED_VOICES:
            raise ValueError(f"Voice '{voice}' is not supported. Supported: {list(VERIFIED_VOICES.keys())}")

        # Protect against concurrent CPU memory corruption / thrashing
        async with self._lock:
            loop = asyncio.get_running_loop()
            # Run CPU-bound synthesis in threadpool
            audio_array = await loop.run_in_executor(
                None,
                lambda: self.model.synthesize(clean_text, lang=lang, voice=voice, seed=seed)
            )

        duration_sec = len(audio_array) / SAMPLE_RATE

        # Encode to in-memory WAV
        buf = io.BytesIO()
        sf.write(buf, audio_array, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        wav_bytes = buf.getvalue()

        # Safely release accelerator cache if running on GPU/MPS
        if self.device == "mps" and hasattr(torch, "mps"):
            try:
                torch.mps.empty_cache()
            except Exception:
                pass
        elif self.device == "cuda" and hasattr(torch, "cuda"):
            try:
                torch.cuda.empty_cache()
            except Exception:
                pass

        return wav_bytes, duration_sec

engine = MithiEngine.get_instance()
