# Third-Party Software & Model Notices

MAVS — Mithi AI Voice Studio incorporates open-source models, libraries, and vendored code. This document provides complete attribution and licensing details for all third-party components utilized.

---

## 1. AI Model & Vendored Engine Code

### Mithi v1 Flash
- **Original Creator / Organization:** Oomni
- **Official Model Repository:** [https://huggingface.co/Oomni/mithi-v1-flash](https://huggingface.co/Oomni/mithi-v1-flash)
- **License:** Apache License 2.0
- **Model Architecture:** 99.1 Million parameters, fast non-autoregressive acoustic and vocoder flow-matching text-to-speech architecture for 11 Indic languages and 2 character voices (`satvik`, `charvi`).
- **Attribution & Relationship:** 
  MAVS is an independent desktop application, frontend interface, dynamic backend runtime supervisor, and installer distribution system developed by Jayesh Bhanderi. The MAVS project does not claim original authorship or original training of the Mithi neural model weights. Model weights are downloaded dynamically on first launch from the official Hugging Face repository and are not bundled inside installer files.

### Components Under `backend/mithi_tts/`
The inference codebase located in `backend/mithi_tts/` is provided by Oomni as part of the official `Oomni/mithi-v1-flash` release under the **Apache License 2.0**:
- **`backend/mithi_tts/text_norm/` (Maya Indic Text Normalizer):**
  - **Source:** Maya Text Normalization pipeline for Indic languages.
  - **License:** Apache License 2.0 (included in `backend/mithi_tts/text_norm/LICENSE`).
  - **Purpose:** Handles script guard, number expansion, punctuation sanitization, and language-specific text preprocessing for 11 Indian languages.
- **`backend/mithi_tts/kokoro/` (Kokoro-82M Decoder & Vocoder):**
  - **Source:** Derived from Kokoro-82M by hexgrad / StyleTTS 2 / iSTFTNet.
  - **License:** Apache License 2.0 / MIT.
  - **Purpose:** Non-autoregressive neural vocoder and acoustic frame generation.
- **`backend/mithi_tts/indic_encoder.py` (Indic-BERT Encoder Wrapper):**
  - **Source:** AI4Bharat / Hugging Face Indic-BERT multilingual representation.
  - **License:** Apache License 2.0 / MIT.
  - **Purpose:** Cross-lingual semantic embedding extraction for Indic text.
- **`backend/mithi_tts/prosody.py` & `backend/mithi_tts/frontend.py`:**
  - **Source:** Oomni Mithi v1 Flash inference frontend.
  - **License:** Apache License 2.0.
  - **Purpose:** Grapheme-to-phoneme (G2P) alignment, prosody prediction, and phoneme tokenization.

---

## 2. Python Backend Dependencies

| Package | License | Purpose | Project URL |
| :--- | :--- | :--- | :--- |
| **PyTorch (torch)** | BSD-3-Clause | Deep learning inference framework (CPU engine) | [https://pytorch.org](https://pytorch.org) |
| **Transformers** | Apache-2.0 | Model architecture definition & weight loading | [https://github.com/huggingface/transformers](https://github.com/huggingface/transformers) |
| **SafeTensors** | Apache-2.0 | Fast, safe tensor serialization format | [https://github.com/huggingface/safetensors](https://github.com/huggingface/safetensors) |
| **SoundFile** | BSD-3-Clause | High-fidelity 24 kHz WAV audio writing (libsndfile wrapper) | [https://github.com/bastibe/python-soundfile](https://github.com/bastibe/python-soundfile) |
| **FastAPI** | MIT | High-performance asynchronous HTTP REST API | [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| **Uvicorn** | BSD-3-Clause | Lightning-fast ASGI web server implementation | [https://www.uvicorn.org](https://www.uvicorn.org) |
| **Misaki & espeakng-loader** | MIT / LGPL-3.0 | Grapheme-to-phoneme conversion and Indic phonemization | [https://github.com/hexgrad/misaki](https://github.com/hexgrad/misaki) |
| **spaCy & en_core_web_sm** | MIT | Natural language processing tokenizer and text pipeline | [https://spacy.io](https://spacy.io) |
| **SentencePiece** | Apache-2.0 | Subword tokenization for multilingual text representations | [https://github.com/google/sentencepiece](https://github.com/google/sentencepiece) |
| **Num2Words** | LGPL-2.1 | Number to localized spoken word expansion | [https://github.com/savoirfairelinux/num2words](https://github.com/savoirfairelinux/num2words) |
| **PyInstaller** | GPL-2.0 with Bootloader Exception | Standalone Python executable bundling | [https://pyinstaller.org](https://pyinstaller.org) |

---

## 3. Desktop Shell & Frontend Dependencies

| Package | License | Purpose | Project URL |
| :--- | :--- | :--- | :--- |
| **Electron** | MIT | Native cross-platform desktop window and lifecycle container | [https://www.electronjs.org](https://www.electronjs.org) |
| **electron-builder** | MIT | Desktop package builder (NSIS installer, AppImage, DMG) | [https://www.electron.build](https://www.electron.build) |
| **React** | MIT | Declarative component UI library | [https://react.dev](https://react.dev) |
| **Vite** | MIT | Fast frontend build tooling | [https://vitejs.dev](https://vitejs.dev) |
| **Tailwind CSS** | MIT | Utility-first CSS layout engine | [https://tailwindcss.com](https://tailwindcss.com) |
| **Lucide React** | ISC | Modern neo-brutalist iconography | [https://lucide.dev](https://lucide.dev) |
| **TypeScript** | Apache-2.0 | Typed JavaScript superset | [https://www.typescriptlang.org](https://www.typescriptlang.org) |

---

## 4. UI Iconography & Graphic Assets

### Flaticon & Vector Icon Suite
The MAVS user interface incorporates a clean, unified outline vector iconography suite located at `frontend/src/components/icons/FlaticonIcons.tsx`:
- **Icon Concepts:** Speech generation microphone with audio waves, sound waveform, multilingual globe, speaker voice selector, neural network model processing, processor hardware chip, refresh control, document script loader, and audio download.
- **Provider & Attribution:** Icons created by [Freepik](https://www.freepik.com) from [Flaticon](https://www.flaticon.com/).
- **License:** Flaticon Free License with attribution.
- **Storage:** Stored entirely locally within the application source code with zero external telemetry, hotlinking, or runtime network requests.

---

## 5. License Notices

Each open-source package mentioned above is copyrighted by its respective authors. The complete text of their licenses is distributed with their respective packages.
