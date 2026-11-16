# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_all, collect_submodules, collect_data_files

block_cipher = None

# Collect all data and binaries for C-extension packages
datas = []
binaries = []
hiddenimports = [
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespans",
    "uvicorn.lifespans.on",
    "uvicorn.lifespans.off",
    "fastapi",
    "starlette",
    "pydantic",
    "torch",
    "transformers",
    "safetensors",
    "sentencepiece",
    "soundfile",
    "misaki",
    "misaki.en",
    "misaki.espeak",
    "phonemizer",
    "phonemizer_fork",
    "espeakng_loader",
    "spacy",
    "en_core_web_sm",
    "num2words",
    "huggingface_hub",
]

# Include mithi_tts package inside the binary
backend_dir = Path(SPECPATH).resolve()
datas.append((str(backend_dir / "mithi_tts"), "mithi_tts"))
datas.append((str(backend_dir / "app"), "app"))

for pkg in ["espeakng_loader", "en_core_web_sm", "spacy", "misaki", "phonemizer_fork", "phonemizer", "num2words", "language_tags"]:
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception as e:
        print(f"Warning: collect_all for {pkg} gave: {e}")

# On macOS, collect native audio libraries from Homebrew if present
if sys.platform == "darwin":
    for lib_dir in [Path("/opt/homebrew/lib"), Path("/usr/local/lib")]:
        if lib_dir.exists():
            for dylib_name in ["libespeak-ng.dylib", "libespeak-ng.1.dylib", "libsndfile.dylib", "libsndfile.1.dylib"]:
                candidate = lib_dir / dylib_name
                if candidate.exists() and candidate.is_file():
                    binaries.append((str(candidate), "."))

a = Analysis(
    ["desktop_server.py"],
    pathex=[str(backend_dir)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "IPython", "notebook", "pytest"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="mavs-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="mavs-backend",
)
