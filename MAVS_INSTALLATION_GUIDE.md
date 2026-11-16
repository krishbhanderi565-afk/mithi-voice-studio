# MAVS — Installation & Setup Guide

This guide provides simple, step-by-step instructions for installing and running **MAVS — Mithi AI Voice Studio** on your computer.

---

## 1. Windows Installation (Recommended)

### System Requirements
- Windows 10 (64-bit) or Windows 11 (64-bit)
- At least 2 GB of free disk space

### Step-by-Step Instructions

1. **Download the Installer:**
   - Locate the installer file: `MAVS-Setup-x64.exe` from the `release/` folder or download link.

2. **Run the Installer:**
   - Double-click `MAVS-Setup-x64.exe`.
   - If Windows SmartScreen shows a prompt ("Windows protected your PC"), click **More info** and then **Run anyway** (this is normal for self-signed or open-source community applications).

3. **Choose Installation Directory:**
   - Select the destination folder (default: `C:\Program Files\MAVS` or `%LOCALAPPDATA%\Programs\MAVS`).
   - Check the box to create a **Desktop Shortcut** and **Start Menu Shortcut**.
   - Click **Install**.

4. **Launch MAVS:**
   - When the installer finishes, leave "Run MAVS" checked and click **Finish**.
   - MAVS opens immediately and handles all backend startup automatically in the background.

---

## 2. Linux Installation

### Option A: Portable AppImage (All Linux Distributions)
1. Download `MAVS-x86_64.AppImage`.
2. Open a terminal in your download folder and make the file executable:
   ```bash
   chmod +x MAVS-x86_64.AppImage
   ```
3. Run the application:
   ```bash
   ./MAVS-x86_64.AppImage
   ```

### Option B: Debian / Ubuntu Package (`.deb`)
1. Download `MAVS-amd64.deb`.
2. Install via terminal:
   ```bash
   sudo dpkg -i MAVS-amd64.deb
   sudo apt-get install -f # Fixes any missing system dependencies
   ```
3. MAVS will appear in your applications menu.

---

## 3. macOS Installation

### Supported Systems
- macOS 12 (Monterey), 13 (Ventura), 14 (Sonoma), 15 (Sequoia)
- Native Apple Silicon (M1, M2, M3, M4) and Intel x64

### Steps
1. Download `MAVS-macOS-AppleSilicon-arm64.dmg` (for Apple Silicon M-series Mac) or `MAVS-macOS-Intel-x64.dmg` (for Intel Mac).
2. Double-click the `.dmg` file to mount it.
3. Drag the **MAVS** icon into your **Applications** folder.
4. Eject the DMG disk image.
5. Open MAVS from your Applications folder or Spotlight.
   *(On first launch, if macOS Gatekeeper displays an unidentified developer notice, right-click the app in Applications and click **Open**, then confirm **Open**; or run `xattr -cr /Applications/MAVS.app` in Terminal).*

---

## 4. Uninstalling MAVS

### On Windows
1. Open Windows **Settings** > **Apps** > **Installed apps**.
2. Search for **MAVS — Mithi AI Voice Studio**.
3. Click the three dots `...` and select **Uninstall**.
4. Follow the on-screen uninstaller wizard.

### Model Weights Clean-Up (Optional)
If you also want to remove downloaded neural model weights (~240 MB) to free disk space:
- Delete the folder: `%APPDATA%\MAVS\models`
