# MAVS — Cross-Platform Desktop Build Guide

This technical guide explains how to compile, bundle, and package **MAVS — Mithi AI Voice Studio** for Windows, Linux, and macOS.

---

## 1. Architectural Overview

MAVS Desktop combines a zero-latency Electron shell with an embedded, isolated Python AI engine:

```
┌────────────────────────────────────────────────────────┐
│                      MAVS Desktop                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Electron Shell (Main & Preload Process)      │  │
│  │     - Dynamic free port negotiation              │  │
│  │     - Child process supervisor & clean exit      │  │
│  │     - Context-isolated IPC bridge                │  │
│  └────────┬─────────────────────────────────────────┘  │
│           │                                            │
│    IPC / Localhost HTTP                                │
│           │                                            │
│  ┌────────▼──────────┐         ┌────────────────────┐  │
│  │ React Frontend UI │         │ Embedded PyBackend │  │
│  │ Vite + Tailwind   │         │ PyTorch + FastAPI  │  │
│  │ Neo-Brutalist     │         │ Mithi v1 Flash TTS │  │
│  └───────────────────┘         └────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Key Technical Strategies
1. **PyInstaller `onedir` Mode:** Freezes the Python 3.12 runtime and PyTorch C++ extensions into a folder structure rather than a single compressed `.exe`. This eliminates cold-start unpack latency (1.5s vs 18s).
2. **Dynamic Port Discovery:** Uses Node.js `net.createServer()` to bind to any free port dynamically, preventing port 8000 collisions with other local developer tools.
3. **Decoupled Model Weights:** Keeps the installer binary lightweight (~90 MB) while weights (~240 MB) download once into the OS standard application data directory.

---

## 2. Building on Windows 10/11 (x64)

### Prerequisites
- Windows 10 (1809+) or Windows 11 x64
- Node.js 20+ and npm
- Python 3.12 (64-bit)

### Steps

#### 1. Compile Backend Executable
```powershell
# In project root with active .venv:
.\.venv\Scripts\pyinstaller.exe --clean --noconfirm backend\mavs_backend.spec
```
Output: `backend/dist/mavs-backend/` containing `mavs-backend.exe`.

#### 2. Build Frontend UI
```powershell
cd frontend
npm install
npm run build
cd ..
```
Output: `frontend/dist/`.

#### 3. Package Electron Installer
```powershell
cd desktop
npm install
npm run build:main
npm run pack:win
cd ..
```
Output: `release/MAVS-Setup-x64.exe` (NSIS installer with desktop/start menu shortcuts).

---

## 3. Building for Linux (x86_64 AppImage & DEB)

### Prerequisites (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv espeak-ng libespeak-ng-dev libsndfile1-dev libasound2-dev nodejs npm
```

### Steps
```bash
# 1. Prepare Python environment
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install pyinstaller

# 2. Freeze backend
pyinstaller --clean --noconfirm backend/mavs_backend.spec

# 3. Build frontend
cd frontend
npm install
npm run build
cd ..

# 4. Package AppImage & DEB
cd desktop
npm install
npm run build:main
npm run pack:linux
```
Output: `release/MAVS-x86_64.AppImage` and `release/MAVS-amd64.deb`.

---

## 4. Building for macOS (Apple Silicon ARM64 & Intel x64)

### Prerequisites
```bash
brew install python@3.12 espeak-ng libsndfile node
```

### Steps
```bash
# 1. Prepare Python environment
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install pyinstaller

# 2. Freeze backend
pyinstaller --clean --noconfirm backend/mavs_backend.spec

# 3. Build frontend
cd frontend
npm install
npm run build
cd ..

# 4. Package DMG
cd desktop
npm install
npm run build:main
npm run pack:mac
```
Output: `release/MAVS-arm64.dmg` or `release/MAVS-x64.dmg`.

---

## 5. Automated Multi-Platform GitHub Actions CI

MAVS includes an automated workflow configured at `.github/workflows/build-desktop.yml`.

Whenever a Git tag (e.g., `v1.0.0`) is pushed, GitHub Actions spawns parallel matrix runners:
- `windows-latest` ➔ Builds `MAVS-Setup-x64.exe`
- `ubuntu-22.04` ➔ Builds `MAVS-x86_64.AppImage` & `.deb`
- `macos-14` ➔ Builds `MAVS-arm64.dmg`

Artifacts are automatically uploaded to the GitHub Action run summary and can be published directly to GitHub Releases.
