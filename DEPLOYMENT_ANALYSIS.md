# Deployment & Free Hosting Assessment (Strict ₹0 Budget) — Mithi AI Voice Studio

**Date:** November 16, 2026  
**Budget:** Strict ₹0 (No credit card, no paid upgrades, no expiring trial credits)  
**Target Model:** [Oomni/mithi-v1-flash](https://huggingface.co/Oomni/mithi-v1-flash) (Apache-2.0, 99.1M parameters, ~239 MB weights)

---

## 1. Hosting Options Evaluation Matrix

| Hosting Provider | Service Target | Free Tier Available? | Model Compatible? | Exact Limits & Quotas | Verdict & Recommendation |
|---|---|---|---|---|---|
| **Hugging Face Spaces** | Backend & Model Inference | **Yes (100% Free)** | **Fully Compatible** | 2 vCPU, **16 GB System RAM**, 50 GB disk. Public HTTPS URL. Sleeps after 48h inactivity. | **RECOMMENDED FOR BACKEND** — The only free provider with ample RAM (>10x model need). |
| **Netlify** | React Frontend (SPA) | **Yes (100% Free)** | N/A (Static Only) | 100 GB bandwidth/mo, 300 build mins/mo, automated SSL, global CDN. | **RECOMMENDED FOR FRONTEND** — Fast, robust, permanent free static hosting. |
| **Render** | Backend & Model Inference | Yes | **INCOMPATIBLE** | **512 MB RAM limit**, 0.1 CPU core, sleeps after 15 mins. | **REJECTED** — 512 MB RAM will instantly crash PyTorch/Mithi with **OOM Exit Code 137**. |
| **Vercel** | Fullstack / Serverless API | Yes | **INCOMPATIBLE** for ML | 250 MB unzipped bundle limit, 10s timeout, serverless architecture. | **REJECTED FOR MODEL** — Serverless cannot load PyTorch + safetensors weights into memory. |
| **Railway** | Fullstack | No permanent free tier | N/A | Only temporary trial credits; requires credit card verification. | **REJECTED** — Violates strict ₹0 budget rule. |
| **Fly.io** | Backend (Containers) | Limited | Questionable | Requires credit card upfront even for free allowance. | **REJECTED** — Violates no credit card rule. |
| **Koyeb** | Backend (Containers) | Yes | **INCOMPATIBLE** | 512 MB RAM free tier; causes PyTorch OOM crashes. | **REJECTED** — Insufficient RAM. |

---

## 2. In-Depth Model Hosting Feasibility Analysis

### A. Hardware & Memory Fit
- **Model Requirements:**
  - Resting memory: ~300 MB
  - Peak inference memory: ~1.1 GB – 1.4 GB
  - Model download size: ~239 MB
- **Hugging Face Spaces Free Tier Allocation:**
  - **16 GB RAM:** Provides a **>11x safety buffer** over peak model memory usage.
  - **2 vCPUs:** Enables fast 2-thread or 4-thread CPU inference (average sentence ~3.5 to 5.0 seconds).
  - **50 GB Disk:** More than 200x the required storage for weights and runtime libraries.
- **Render / Koyeb / Vercel Free Tiers:**
  - Strictly limited to 250 MB–512 MB, making PyTorch CPU inference technically impossible without paying.

### B. Inactivity & Cold Starts
- **Hugging Face Spaces Policy:** A free Space sleeps after **48 hours of inactivity**.
- **Cold-Start Experience:** When a user visits after the Space has slept, the first request triggers a container wake-up:
  - Docker container start: ~15–25 seconds.
  - Model weights load into memory: ~1.5–2.0 seconds.
  - Total cold start: ~20–30 seconds.
  - Once awake, inference is instantaneous (~2–4s per sentence).
- **Frontend Mitigation:** The frontend already has a real-time status checker (`/health`). If the backend is waking up, the UI displays a clean `"Backend Connecting..."` banner with a spinner instead of throwing an unhandled error.

### C. License & Legal Permissions
- **Model License:** Apache License 2.0.
- **Terms:** Explicitly grants worldwide, royalty-free rights to use, reproduce, modify, display, and distribute the work commercially or non-commercially.
- **Attribution:** Credits to Oomni, Maya Research, Kokoro-82M, and Indic-BERT are included in the UI footer and documentation.

---

## 3. Recommended ₹0 Production Architecture

```
[ User Browser ]
       |
       |  HTTPS (Global Edge CDN)
       v
[ Netlify (Free Starter) ]
   - Serves React + Vite + Tailwind SPA
   - Custom environment variable: VITE_API_BASE_URL
       |
       |  REST API (HTTPS JSON / WAV binary stream)
       v
[ Hugging Face Spaces (Free CPU Basic Tier) ]
   - 2 vCPU | 16 GB RAM | 50 GB Disk
   - Runs official FastAPI + Uvicorn + Mithi v1 Flash
   - CORS restricted to Netlify domain (or open for public demo)
```

---

## 4. Security, Reliability & Abuse Protection

1. **CORS Security:**
   - On Hugging Face Spaces, `CORSMiddleware` will accept the Netlify deployment URL (e.g. `https://mithi-voice-studio.netlify.app`) as an authorized origin.
2. **Text Length & Request Limits:**
   - Maximum text length is hard-enforced at 1,000 characters to prevent CPU starvation.
   - Pydantic strictly validates all parameters before model execution.
3. **Concurrency Serialization:**
   - The backend utilizes an asynchronous lock (`asyncio.Lock`) so simultaneous public requests are processed sequentially without causing CPU core contention or out-of-memory spikes.
4. **Temporary Resource Hygiene:**
   - Audio is generated entirely in-memory using `io.BytesIO` streams; no temporary audio files are stored on disk.
   - Object URLs on the frontend are revoked automatically via `URL.revokeObjectURL`.
5. **Secrets & Tokens:**
   - Mithi v1 Flash is a public model repository; no private Hugging Face tokens are required.
   - No payment keys, database connection strings, or credentials exist.

---

## 5. Potential Failure Points & Solutions

| Failure Mode | Root Cause | Built-in Mitigation |
|---|---|---|
| **Cold Start Timeout** | Space sleeping after 48h | Frontend `/health` polling displays informative connecting state until container reports `model_loaded: true`. |
| **CORS Block** | Mismatched origin between Netlify and HF | Backend configured to read `CORS_ORIGINS` from environment variables, supporting both local and Netlify domains. |
| **Concurrent Request Spike** | Multiple users generating audio at once | `asyncio.Lock` serializes synthesis, queuing requests cleanly with fast CPU execution (~2–3s each). |
| **HF Spaces Network Flake** | Temporary Hugging Face hub downtime | Model weights are downloaded during container startup or baked into the Docker image, eliminating runtime fetch dependencies. |

---

## 6. What Would Eventually Require Payment?

The proposed architecture is 100% free under the following traffic:
- **Netlify:** Up to 100 GB bandwidth / month (equivalent to ~500,000 page visits / month).
- **Hugging Face Spaces:** Up to 48 hours of continuous uptime between visits, unlimited requests during active hours, 16 GB RAM permanently free.

**When would payment be needed?**
- If traffic exceeds ~50 concurrent users per minute wanting simultaneous sub-second GPU inference (would require an upgraded dedicated NVIDIA T4 GPU Space at ~$0.60/hr).
- If continuous 24/7/365 zero-sleep uptime with dedicated hardware is required (Hugging Face persistent hardware upgrade).
- For a personal portfolio, hackathon, demonstration, or regular community use, the **₹0 free tier is fully viable and permanent**.

---

## 7. Step-by-Step Deployment Plan (Ready for Execution when Approved)

### Step 1: Deploy Backend to Hugging Face Spaces (Free CPU)
1. Create a free Space on Hugging Face:
   - Name: `mithi-voice-studio-api`
   - SDK: `Docker` (or `Gradio/FastAPI`)
   - Hardware: `CPU basic • 2 vCPU • 16 GB RAM • Free`
2. Push backend files (`backend/app/`, `backend/requirements.txt`, and a lightweight `Dockerfile`).
3. Space builds, installs dependencies, downloads weights, and launches on `https://<hf-user>-mithi-voice-studio-api.hf.space`.

### Step 2: Deploy Frontend to Netlify
1. Connect GitHub repository to Netlify (or deploy via Netlify CLI).
2. Configure build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. Set environment variable:
   - `VITE_API_BASE_URL = https://<hf-user>-mithi-voice-studio-api.hf.space`
4. Netlify deploys globally to `https://<site-name>.netlify.app`.

### Step 3: End-to-End Live Production Verification
1. Open the Netlify URL in an incognito window.
2. Verify green "Model Ready (CPU)" badge.
3. Generate speech in Hindi, English, and Gujarati.
4. Verify audio playback and WAV file download over the public internet.
