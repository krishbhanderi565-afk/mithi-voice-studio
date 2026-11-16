import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
import soundfile as sf
import io

print("Creating TestClient and initializing app...")
with TestClient(app) as client:
    print("\n--- 1. Testing GET /health ---")
    r = client.get("/health")
    print("Status:", r.status_code)
    print("Response:", r.json())
    assert r.status_code == 200, f"Health check failed: {r.text}"
    assert r.json()["model_loaded"] is True, "Model not marked as loaded"

    print("\n--- 2. Testing GET /api/config ---")
    r = client.get("/api/config")
    print("Status:", r.status_code)
    config_data = r.json()
    print("Languages count:", len(config_data["languages"]))
    print("Voices:", [v["id"] for v in config_data["voices"]])
    assert r.status_code == 200
    assert len(config_data["languages"]) == 11
    assert len(config_data["voices"]) == 2

    print("\n--- 3. Testing POST /api/generate (Valid English text) ---")
    gen_payload = {
        "text": "Hello and welcome to Mithi AI Voice Studio.",
        "language": "en",
        "voice": "satvik"
    }
    r = client.post("/api/generate", json=gen_payload)
    print("Status:", r.status_code)
    print("Content-Type:", r.headers.get("content-type"))
    print("Content-Disposition:", r.headers.get("content-disposition"))
    print("Audio Duration Header:", r.headers.get("x-audio-duration"))
    print("Audio bytes received:", len(r.content))
    assert r.status_code == 200, f"Generate failed: {r.text}"
    assert r.headers.get("content-type") == "audio/wav"

    # Verify audio properties from returned bytes
    wav_buf = io.BytesIO(r.content)
    info = sf.info(wav_buf)
    print(f"Verified WAV: {info.samplerate} Hz, {info.channels} channel, {info.duration:.2f}s, {info.format}")
    assert info.samplerate == 24000
    assert info.channels == 1
    assert info.duration > 1.0

    # Save test output
    with open("backend/api_test_output.wav", "wb") as f:
        f.write(r.content)
    print("Saved generated audio to backend/api_test_output.wav")

    print("\n--- 4. Testing POST /api/generate (Invalid language) ---")
    bad_payload = {
        "text": "Test error",
        "language": "fr",
        "voice": "satvik"
    }
    r = client.post("/api/generate", json=bad_payload)
    print("Status:", r.status_code)
    print("Response:", r.json())
    assert r.status_code == 400

    print("\n--- 5. Testing POST /api/generate (Empty text) ---")
    bad_payload2 = {
        "text": "   ",
        "language": "en",
        "voice": "satvik"
    }
    r = client.post("/api/generate", json=bad_payload2)
    print("Status:", r.status_code)
    print("Response:", r.json())
    assert r.status_code == 400

    print("\nAll API tests PASSED successfully!")
