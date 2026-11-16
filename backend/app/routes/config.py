from fastapi import APIRouter
from ..schemas.config import (
    AppConfigResponse,
    LanguageOption,
    VoiceOption,
    AudioFormatConfig
)
from ..services.mithi_engine import (
    VERIFIED_LANGUAGES,
    VERIFIED_VOICES,
    SAMPLE_RATE
)
from ..config import settings

router = APIRouter(prefix="/api", tags=["Configuration"])

@router.get("/config", response_model=AppConfigResponse)
def get_config():
    """Return verified supported languages, voices, output audio format, and limits."""
    languages = [
        LanguageOption(code=code, name=meta["name"], native_name=meta["native_name"])
        for code, meta in VERIFIED_LANGUAGES.items()
    ]

    voices = [
        VoiceOption(
            id=voice_id,
            name=meta["name"],
            gender=meta["gender"],
            description=meta["description"]
        )
        for voice_id, meta in VERIFIED_VOICES.items()
    ]

    return AppConfigResponse(
        model_name="mithi-v1-flash",
        model_version=settings.app_version,
        default_language="en",
        default_voice="satvik",
        max_text_length=settings.max_text_length,
        languages=languages,
        voices=voices,
        audio_format=AudioFormatConfig(
            media_type="audio/wav",
            sample_rate=SAMPLE_RATE,
            channels=1,
            bits_per_sample=16,
            codec="PCM_16"
        )
    )
