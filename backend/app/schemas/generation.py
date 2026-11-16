from pydantic import BaseModel, Field
from typing import Optional

class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000000, description="Text to synthesize into speech")
    language: str = Field(default="en", description="Supported language code: hi, en, bn, gu, kn, ml, mr, or, pa, ta, te")
    voice: str = Field(default="satvik", description="Supported voice: satvik or charvi")
    seed: Optional[int] = Field(default=None, description="Optional random seed for reproducible prosody")

class GenerateResponseMeta(BaseModel):
    duration_seconds: float
    sample_rate: int = 24000
    language: str
    voice: str
    format: str = "audio/wav"
