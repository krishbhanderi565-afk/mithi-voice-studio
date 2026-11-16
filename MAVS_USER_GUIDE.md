# MAVS — User Guide

Welcome to **MAVS — Mithi AI Voice Studio**, a native desktop speech synthesis workstation powered by the official **Mithi v1 Flash** neural model developed by Oomni.

---

## 1. Quick Start

### Launching the Application
Double-click the **MAVS** icon on your Desktop or launch it from your Windows Start Menu.

When launched:
1. MAVS automatically discovers a free local port and spins up its embedded high-performance AI inference engine in the background.
2. The user interface opens instantly.

---

## 2. First Launch — Model Setup

MAVS keeps installer download sizes minimal (~90 MB) by separating model weights from the executable.

On your first run:
1. A **Model Setup** dialog will appear informing you that the neural voice weights (approx. 240 MB) need to be initialized.
2. Click **Download & Initialize Model**.
3. A progress bar will track the download of the 11-language acoustic model and vocoder.
4. Once completed, the model is verified, loaded into CPU memory, and marked ready.

> [!TIP]
> **Existing Local Weights:** If you previously downloaded weights in development mode or have them on your drive, MAVS automatically detects them in `%APPDATA%\MAVS\models\mithi-v1-flash` and skips the download entirely!

---

## 3. Generating Speech

Follow these simple steps in the studio:

```
[ 1. Select Language ] ──> [ 2. Select Voice ] ──> [ 3. Enter Text ] ──> [ 4. Generate ]
```

### Step 1: Select Language
Choose from any of the 11 supported Indic languages from the dynamic dropdown:
- **Hindi (हिन्दी)**
- **English (Indian Accent)**
- **Bengali (বাংলা)**
- **Gujarati (ગુજરાતી)**
- **Kannada (ಕನ್ನಡ)**
- **Malayalam (മലയാളം)**
- **Marathi (मराठी)**
- **Odia (ଓଡ଼ିଆ)**
- **Punjabi (ਪੰਜਾਬੀ)**
- **Tamil (தமிழ்)**
- **Telugu (తెలుగు)**

### Step 2: Select Voice
Choose between two distinct neural character voices:
- **Satvik:** Deep, natural, clear masculine voice. Ideal for narrations, explanations, and long reads.
- **Charvi:** Warm, melodic, articulate feminine voice. Ideal for conversational assistants, stories, and presentations.

### Step 3: Enter Your Script
- Type or paste your text into the central prompt canvas.
- MAVS supports long-form scripts with an extended limit of **100,000 characters**.
- A real-time character counter tracks your input length.

### Step 4: Click "Generate Audio"
- Click the high-contrast **GENERATE AUDIO** button (or press `Ctrl + Enter`).
- The button will display a spinning indicator and real-time elapsed timer while the CPU neural engine converts your text into acoustic flow tokens.
- Generation typically takes only 1.5 to 3 seconds for standard paragraphs.

---

## 4. Playback and WAV Export

When generation finishes:
- The custom **Neo-Brutalist Audio Player** appears below the controls.
- **Play/Pause:** Click the play toggle button or press Spacebar.
- **Scrubbing:** Drag anywhere along the timeline bar to jump to any point in the speech.
- **Download:** Click the **DOWNLOAD WAV** button to save the studio-quality 24 kHz 16-bit uncompressed WAV file directly to your computer.

---

## 5. Offline Capabilities

MAVS is designed for **total privacy and offline security**:
- Once model weights are downloaded, MAVS requires **no internet connection**.
- All text processing, phonemization, and speech synthesis are calculated **100% locally** on your computer.
- No text or voice recordings are ever sent to the cloud.

---

## 6. Frequently Asked Questions (FAQ)

### Can I run MAVS without an NVIDIA GPU?
**Yes.** MAVS is optimized for modern x64 CPUs with multi-threaded vector extensions (AVX/AVX2). A dedicated GPU is not needed.

### Where are my downloaded models stored?
On Windows, models are stored in:
`%APPDATA%\MAVS\models\mithi-v1-flash`

### How do I close MAVS completely?
Simply close the MAVS desktop window. Electron automatically terminates the background Python engine process cleanly, leaving no orphaned background tasks.
