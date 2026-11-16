# MAVS — Mithi AI Voice Studio

High-fidelity desktop and web text-to-speech studio for 11 Indian languages powered by the official **[Mithi v1 Flash](https://huggingface.co/Oomni/mithi-v1-flash)** neural model (99.1M parameters, Apache-2.0).

---

## Attribution & Project Clarification

- **MAVS (Mithi AI Voice Studio):** An independent desktop application, web frontend, Python runtime manager, and cross-platform distribution suite developed by Jayesh Bhanderi.
- **Original AI Model:** **Mithi v1 Flash**, created and trained by **Oomni** ([https://huggingface.co/Oomni/mithi-v1-flash](https://huggingface.co/Oomni/mithi-v1-flash)), released under Apache License 2.0.
- **Weights Distribution:** Model weights (~239 MB) are downloaded dynamically on first launch from Hugging Face with hash verification and stored in the OS-appropriate application directory. Model weights are not bundled inside installer packages.

---

## Features

- **11 Verified Indic Languages:** Hindi, English, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, and Telugu.
- **2 Expressive Voices:** Satvik (male) and Charvi (female).
- **Studio-Quality Audio:** Generates genuine 24,000 Hz (24 kHz) 16-bit Mono PCM WAV audio.
- **Fast CPU Inference:** Runs 100% locally on CPU via PyTorch with multi-threading optimization.
- **Modern UI:** Built with React 19, Vite, TypeScript, and Neo-brutalist Tailwind CSS.
- **Integrated Audio Player:** Scrub bar, time counter, volume control, and instant WAV download.
- **Dynamic Port Allocation:** Electron desktop shell automatically selects an available localhost port and supervises the Python backend lifecycle.

---

## Desktop Installers & Supported Platforms

| Platform | Target File | Build Pipeline | Gatekeeper / Security Note |
| :--- | :--- | :--- | :--- |
| **Windows 10/11 (x64)** | `MAVS-Setup-x64.exe` | Verified & Tested | NSIS one-click or custom directory setup |
| **macOS Apple Silicon (ARM64)** | `MAVS-macOS-AppleSilicon-arm64.dmg` | GitHub Actions CI (`macos-14`) | Unsigned community build; run `xattr -cr /Applications/MAVS.app` |
| **macOS Intel (x64)** | `MAVS-macOS-Intel-x64.dmg` | GitHub Actions CI (`macos-13`) | Unsigned community build; run `xattr -cr /Applications/MAVS.app` |

*Note: macOS DMG installers are compiled natively on GitHub Actions Mac runners. Physical Mac hardware is required for final audio playback verification.*

---

## Local Development Setup

All commands below run in PowerShell from the repository root.

### 1. Backend Setup

```powershell
# 1. Create and activate Python 3.12 virtual environment
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install backend dependencies & spaCy language model
pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm

# 3. Start the FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend endpoints:
- Health Check: `http://127.0.0.1:8000/health`
- API Configuration: `http://127.0.0.1:8000/api/config`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

In a new terminal:

```powershell
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

Frontend will be live at:
- **`http://localhost:5173`**

---

### 3. Packaging Desktop Installers Locally (Windows)

```powershell
cd desktop
npm install
npm run build
npm run pack:win
```

Packaged Windows installer will be placed in `release/MAVS-Setup-x64.exe`.

---

## Environment Variables

### Backend (`backend/.env`)
```ini
MITHI_MODEL_DIR=backend/mithi-v1-flash
MITHI_DEVICE=cpu
MITHI_CPU_THREADS=4
MAX_TEXT_LENGTH=100000
HOST=127.0.0.1
PORT=8000
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## License & Attribution

- **Application Code:** Apache-2.0
- **Model:** [Oomni/mithi-v1-flash](https://huggingface.co/Oomni/mithi-v1-flash) (Apache-2.0)
- **Base Components:**
  - Kokoro-82M (Apache-2.0)
  - Indic-BERT (MIT / Apache-2.0)
  - Maya text normaliser (Apache-2.0)
  - Misaki (Apache-2.0)
  - spaCy (MIT)
