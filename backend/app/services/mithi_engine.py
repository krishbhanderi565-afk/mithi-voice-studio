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
        self.cancel_event = threading.Event()
        self.active_generation = {
            "is_active": False,
            "stage": "Idle",
            "current_chunk": 0,
            "total_chunks": 0,
            "start_time": 0.0,
            "elapsed_sec": 0.0,
            "text_length": 0
        }

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

                # Ensure backend and model directory are on sys.path so mithi_tts can be imported
                backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                if backend_root not in sys.path:
                    sys.path.insert(0, backend_root)
                if model_path not in sys.path:
                    sys.path.append(model_path)

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

                # Pre-warm G2P for common languages in background to eliminate first-request delay
                try:
                    from mithi_tts import frontend as fe
                    fe.phonemes("नमस्ते", "hi")
                    fe.phonemes("Welcome", "en")
                    logger.info("Pre-warmed G2P frontend for Hindi and English.")
                except Exception as warmup_err:
                    logger.warning(f"G2P frontend warmup notice: {warmup_err}")

            except Exception as e:
                self.is_loaded = False
                self.is_loading = False
                self.load_error = f"Failed to load Mithi v1 Flash: {str(e)}"
                self._init_event.set()
                logger.exception(self.load_error)

    def cancel_active_generation(self) -> bool:
        """Signal cancellation of any running synthesis."""
        if self.active_generation.get("is_active"):
            self.cancel_event.set()
            self.active_generation["stage"] = "Cancelling generation..."
            logger.info("Cancellation event set for active speech generation.")
            return True
        return False

    def get_progress(self) -> dict:
        """Return current generation progress status."""
        active = bool(self.active_generation.get("is_active"))
        elapsed = time.time() - self.active_generation["start_time"] if active else 0.0
        return {
            "active": active,
            "stage": self.active_generation.get("stage", "Idle"),
            "current_chunk": self.active_generation.get("current_chunk", 0),
            "total_chunks": self.active_generation.get("total_chunks", 0),
            "elapsed_sec": round(elapsed, 1),
            "text_length": self.active_generation.get("text_length", 0),
            "can_cancel": active
        }

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
        """Synthesize text into WAV audio bytes with detailed stage timing and live progress updates.
        
        Returns:
            Tuple[bytes, float]: (wav_bytes, duration_seconds)
        """
        t_req_received = time.time()
        logger.info(f"[TTS Pipeline] Request received. Text length: {len(text)} chars | Lang: {lang} | Voice: {voice}")

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

        t_preprocessed = time.time()
        logger.info(f"[TTS Pipeline] Text preprocessing completed in {(t_preprocessed - t_req_received)*1000:.1f}ms")

        # Reset cancellation event and set active progress state
        self.cancel_event.clear()
        self.active_generation["is_active"] = True
        self.active_generation["start_time"] = t_req_received
        self.active_generation["text_length"] = len(clean_text)
        self.active_generation["current_chunk"] = 0
        self.active_generation["total_chunks"] = 0
        self.active_generation["stage"] = "Analyzing text and chunking sentence structure..."

        def on_chunk_progress(current: int, total: int, chunk_text: str):
            elapsed = time.time() - t_req_received
            pct = int((current / total) * 100) if total > 0 else 0
            self.active_generation["current_chunk"] = current
            self.active_generation["total_chunks"] = total
            self.active_generation["stage"] = f"Generating sentence {current} of {total} ({pct}%)..."
            logger.info(f"[TTS Pipeline] Sentence {current}/{total} generated ({pct}%) in {elapsed:.1f}s: '{chunk_text[:35]}...'")

        # Protect against concurrent CPU memory corruption / thrashing
        try:
            async with self._lock:
                loop = asyncio.get_running_loop()
                # Run CPU-bound synthesis in threadpool with progress callback and cancel token
                audio_array = await loop.run_in_executor(
                    None,
                    lambda: self.model.synthesize(
                        clean_text,
                        lang=lang,
                        voice=voice,
                        seed=seed,
                        on_progress=on_chunk_progress,
                        cancel_event=self.cancel_event
                    )
                )

            t_concat = time.time()
            duration_sec = len(audio_array) / SAMPLE_RATE
            logger.info(f"[TTS Pipeline] Audio generation and concatenation completed in {(t_concat - t_preprocessed):.2f}s (Audio: {duration_sec:.2f}s)")

            # Encode to in-memory WAV
            t_wav_start = time.time()
            buf = io.BytesIO()
            sf.write(buf, audio_array, SAMPLE_RATE, format="WAV", subtype="PCM_16")
            wav_bytes = buf.getvalue()
            t_wav_end = time.time()
            logger.info(f"[TTS Pipeline] WAV encoding completed in {(t_wav_end - t_wav_start)*1000:.1f}ms ({len(wav_bytes)} bytes)")

            total_elapsed = t_wav_end - t_req_received
            rtf = total_elapsed / duration_sec if duration_sec > 0 else 0
            logger.info(f"[TTS Pipeline] Response ready: Total {total_elapsed:.2f}s for {duration_sec:.2f}s audio | RTF: {rtf:.2f}x")

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

        finally:
            self.active_generation["is_active"] = False
            self.active_generation["stage"] = "Completed"

engine = MithiEngine.get_instance()
