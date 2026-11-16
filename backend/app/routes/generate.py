import logging
from fastapi import APIRouter, HTTPException, status, Response
from ..schemas.generation import GenerateRequest
from ..services.mithi_engine import engine, VERIFIED_LANGUAGES, VERIFIED_VOICES
from ..config import settings

logger = logging.getLogger("generate_route")

router = APIRouter(prefix="/api", tags=["Speech Generation"])

@router.post(
    "/generate",
    response_class=Response,
    responses={
        200: {
            "content": {"audio/wav": {}},
            "description": "Generated 24 kHz 16-bit Mono WAV audio file",
        },
        400: {"description": "Invalid input parameters (text, language, voice)"},
        503: {"description": "Mithi model not initialized or unavailable"},
        500: {"description": "Speech synthesis failed"},
    }
)
async def generate_speech(request: GenerateRequest):
    """Generate high-quality speech audio from text using official Mithi v1 Flash.
    Returns real 24 kHz WAV audio directly.
    """
    if not engine.is_loaded:
        if engine.is_loading:
            logger.info("Speech generation requested while model is initializing. Waiting for model load...")
            import asyncio
            loop = asyncio.get_running_loop()
            ready = await loop.run_in_executor(None, lambda: engine.ensure_loaded(60.0))
            if not ready:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Speech model initialization timed out: {engine.load_error or 'Still initializing'}"
                )
        else:
            logger.error(f"Generate requested but model not ready: {engine.load_error}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Speech model is not ready. {engine.load_error or 'Initializing...'}"
            )

    # Validate text
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty."
        )

    if len(clean_text) > settings.max_text_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text exceeds maximum allowed length of {settings.max_text_length} characters."
        )

    # Validate language
    lang = request.language.lower().strip()
    if lang not in VERIFIED_LANGUAGES:
        valid_langs = ", ".join(VERIFIED_LANGUAGES.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language code '{lang}'. Supported: {valid_langs}"
        )

    # Validate voice
    voice = request.voice.lower().strip()
    if voice not in VERIFIED_VOICES:
        valid_voices = ", ".join(VERIFIED_VOICES.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported voice '{voice}'. Supported: {valid_voices}"
        )

    try:
        wav_bytes, duration = await engine.synthesize(
            text=clean_text,
            lang=lang,
            voice=voice,
            seed=request.seed
        )

        headers = {
            "Content-Type": "audio/wav",
            "Content-Disposition": 'inline; filename="mithi-generated-audio.wav"',
            "X-Audio-Duration": f"{duration:.2f}",
            "X-Sample-Rate": "24000",
            "X-Language": lang,
            "X-Voice": voice,
            "Access-Control-Expose-Headers": "Content-Disposition, X-Audio-Duration, X-Sample-Rate, X-Language, X-Voice"
        }

        return Response(content=wav_bytes, media_type="audio/wav", headers=headers)

    except ValueError as ve:
        logger.warning(f"Validation error during synthesis: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.exception("Inference error during speech generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating speech. Please check your text input and try again."
        )
