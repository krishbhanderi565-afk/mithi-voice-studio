from pydantic import BaseModel
from typing import List, Dict

class VoiceOption(BaseModel):
    id: str
    name: str
    gender: str
    description: str

class LanguageOption(BaseModel):
    code: str
    name: str
    native_name: str

class AudioFormatConfig(BaseModel):
    media_type: str = "audio/wav"
    sample_rate: int = 24000
    channels: int = 1
    bits_per_sample: int = 16
    codec: str = "PCM_16"

class AppConfigResponse(BaseModel):
    model_name: str
    model_version: str
    default_language: str
    default_voice: str
    max_text_length: int
    languages: List[LanguageOption]
    voices: List[VoiceOption]
    audio_format: AudioFormatConfig

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    cpu_threads: int
    model_name: str
    model_version: str
    details: Dict[str, str] = {}
