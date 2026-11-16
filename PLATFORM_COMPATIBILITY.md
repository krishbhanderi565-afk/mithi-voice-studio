# MAVS — Platform Compatibility & System Requirements

This document outlines the hardware requirements, operating system support matrix, and architecture notes for **MAVS — Mithi AI Voice Studio**.

---

## 1. Operating System Support Matrix

| Operating System | Architecture | Package Format | Status & Verification |
| :--- | :--- | :--- | :--- |
| **Windows 11** | x64 (64-bit Intel/AMD) | NSIS Installer (`.exe`) | **Native Verified**: Tested on Windows 11 Build 26200 |
| **Windows 10** | x64 (64-bit Intel/AMD) | NSIS Installer (`.exe`) | Supported (Version 1809 and later) |
| **Linux (Ubuntu/Debian)** | x86_64 | `.deb` package | Configured via GitHub Actions CI / electron-builder |
| **Linux (Universal)** | x86_64 | Standalone `.AppImage` | Configured via GitHub Actions CI / electron-builder |
| **macOS (Apple Silicon)** | ARM64 (M1/M2/M3/M4) | DMG (`.dmg`) | Configured via GitHub Actions CI (`macos-14` runner) |
| **macOS (Intel)** | x86_64 | DMG (`.dmg`) | Configured via GitHub Actions CI (`macos-13` runner) |

> [!NOTE]
> Windows builds are compiled and tested directly on the native host. Linux and macOS packages are targeted and automated using GitHub Actions workflows with native runner environments (`ubuntu-22.04` and `macos-14`) to ensure binary compatibility with their respective kernel and C library standards.

---

## 2. Hardware Specifications

### Minimum Requirements
- **Processor:** 64-bit Dual-Core CPU (Intel Core i3 / AMD Ryzen 3 or equivalent) with SSE4.2 and AVX instructions
- **RAM:** 4 GB system memory (MAVS idle footprint is ~150 MB; peak synthesis memory usage is ~1.2 GB)
- **Free Storage:** 2 GB available disk space (approx. 700 MB application runtime + 240 MB model weights + temporary WAV cache)
- **Audio Output:** Any standard stereo or mono audio output device (speakers, headphones)
- **Internet:** Required only for first-launch model weight retrieval (approx. 240 MB) from Hugging Face. Once downloaded, MAVS is **100% offline-capable**.

### Recommended Requirements
- **Processor:** 4 cores / 8 threads (e.g. Intel Core i5 11th Gen / AMD Ryzen 5 or Apple Silicon M-series)
- **RAM:** 8 GB or 16 GB DDR4/DDR5 system memory
- **Free Storage:** 5 GB free SSD storage
- **Graphics / Acceleration:** Dedicated GPU is **not required**. MAVS utilizes PyTorch CPU-optimized tensor cores with multi-threaded kernel execution.

---

## 3. Storage & Configuration Locations

MAVS stores persistent model weights, configuration, and logs in standard user data directories to guarantee compatibility with restricted/non-administrator environments:

- **Windows:** `%APPDATA%\MAVS` (typically `C:\Users\<User>\AppData\Roaming\MAVS`)
- **Linux:** `~/.local/share/MAVS`
- **macOS:** `~/Library/Application Support/MAVS`

Weights downloaded here persist across application upgrades and uninstalls, avoiding repetitive downloads.
