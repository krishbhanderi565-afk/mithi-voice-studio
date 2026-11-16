import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import * as http from 'http';
import { spawn, ChildProcess, execSync } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
let allocatedPort: number = 8000;
let backendUrl: string = 'http://127.0.0.1:8000';
let isBackendReady = false;

// 1. Dynamic Localhost Port Allocation
function findFreePort(startPort: number = 8000): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      // If startPort is occupied, grab an ephemeral port
      const eph = net.createServer();
      eph.listen(0, '127.0.0.1', () => {
        const port = (eph.address() as net.AddressInfo).port;
        eph.close(() => resolve(port));
      });
    });
  });
}

// 2. Poll Backend Health with fast-start progressive backoff
function waitForBackendReady(port: number, timeoutSec: number = 90): Promise<boolean> {
  const startTime = Date.now();
  const url = `http://127.0.0.1:${port}/health`;

  return new Promise((resolve) => {
    let delay = 100; // Check fast initially (100ms)
    let timer: NodeJS.Timeout | null = null;
    let resolved = false;

    const check = () => {
      if (resolved) return;
      if (Date.now() - startTime > timeoutSec * 1000) {
        resolved = true;
        console.warn(`[MAVS Desktop] waitForBackendReady timed out after ${timeoutSec}s`);
        resolve(false);
        return;
      }

      const req = http.get(url, (res) => {
        res.resume(); // Cleanly consume stream to free underlying socket
        if (res.statusCode === 200 || res.statusCode === 503) {
          resolved = true;
          if (timer) clearTimeout(timer);
          console.log(`[MAVS Desktop] Backend ready on port ${port} (HTTP ${res.statusCode}) in ${Date.now() - startTime}ms`);
          resolve(true);
        } else {
          scheduleNext();
        }
      });

      req.on('error', () => {
        scheduleNext();
      });
      req.setTimeout(1500, () => {
        req.destroy();
        scheduleNext();
      });
      req.end();
    };

    const scheduleNext = () => {
      if (resolved) return;
      delay = Math.min(delay + 50, 400); // Gradual step up to 400ms max
      timer = setTimeout(check, delay);
    };

    // Immediate first check
    check();
  });
}

// 3. Launch Backend Process
async function startBackend(): Promise<void> {
  if (backendProcess && backendProcess.pid) {
    console.log(`[MAVS Desktop] Backend process already running (PID: ${backendProcess.pid})`);
    return;
  }

  allocatedPort = await findFreePort(8000);
  backendUrl = `http://127.0.0.1:${allocatedPort}`;
  console.log(`[MAVS Desktop] Allocated local port: ${allocatedPort}`);

  const userDataDir = app.getPath('userData');
  console.log(`[MAVS Desktop] User application data dir: ${userDataDir}`);

  let exePath: string;
  let args: string[];
  let cwd: string;

  if (app.isPackaged) {
    // Production: packaged PyInstaller executable in resources/bin/mavs-backend/
    const binName = process.platform === 'win32' ? 'mavs-backend.exe' : 'mavs-backend';
    exePath = path.join(process.resourcesPath, 'bin', 'mavs-backend', binName);
    args = [
      '--host', '127.0.0.1',
      '--port', allocatedPort.toString(),
      '--data-dir', userDataDir,
    ];
    cwd = path.dirname(exePath);
  } else {
    // Development: run python using local .venv
    const isWin = process.platform === 'win32';
    exePath = isWin
      ? path.join(__dirname, '../../../.venv/Scripts/python.exe')
      : path.join(__dirname, '../../../.venv/bin/python');
    const serverScript = path.join(__dirname, '../../../backend/desktop_server.py');
    args = [
      serverScript,
      '--host', '127.0.0.1',
      '--port', allocatedPort.toString(),
      '--data-dir', userDataDir,
    ];
    cwd = path.join(__dirname, '../../../backend');
  }

  console.log(`[MAVS Desktop] Launching backend: ${exePath} ${args.join(' ')}`);

  // Ensure Unix executable permission if packaged on macOS/Linux
  if (process.platform !== 'win32' && fs.existsSync(exePath)) {
    try {
      fs.chmodSync(exePath, 0o755);
    } catch (permErr) {
      console.warn('[MAVS Desktop] Warning: could not set executable permissions on backend binary:', permErr);
    }
  }

  try {
    backendProcess = spawn(exePath, args, {
      cwd,
      env: {
        ...process.env,
        MAVS_DATA_DIR: userDataDir,
        HOST: '127.0.0.1',
        PORT: allocatedPort.toString(),
        DYLD_LIBRARY_PATH: cwd + (process.env.DYLD_LIBRARY_PATH ? `:${process.env.DYLD_LIBRARY_PATH}` : ''),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Backend stdout] ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`[Backend stderr] ${data.toString().trim()}`);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`[MAVS Desktop] Backend process exited (code: ${code}, signal: ${signal})`);
      isBackendReady = false;
      if (mainWindow) {
        mainWindow.webContents.send('backend-status', { ready: false, error: `Backend exited with code ${code}` });
      }
    });

    // Wait for health endpoint
    const ready = await waitForBackendReady(allocatedPort, 90);
    isBackendReady = ready;
    console.log(`[MAVS Desktop] Backend readiness result: ${ready}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-status', { ready, error: ready ? undefined : 'Backend startup timed out' });
    }
  } catch (err: unknown) {
    console.error('[MAVS Desktop] Failed to spawn backend process:', err);
    if (mainWindow) {
      mainWindow.webContents.send('backend-status', { ready: false, error: String(err) });
    }
  }
}

// 4. Stop Backend Process Gracefully
function stopBackend(): void {
  if (!backendProcess || !backendProcess.pid) return;

  const pid = backendProcess.pid;
  console.log(`[MAVS Desktop] Terminating backend process (PID: ${pid})...`);
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid} >nul 2>&1`);
    } else {
      // On macOS/Linux, kill process group cleanly
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {}
      }
    }
  } catch {
    try {
      backendProcess.kill('SIGKILL');
    } catch {
      // Process already terminated
    }
  }
  backendProcess = null;
}

// 5. Create Desktop Window
function createWindow(): void {
  // Resolve platform-appropriate application window icon
  const iconCandidates = [
    path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    path.join(__dirname, '../assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    path.join(__dirname, 'renderer', 'favicon.png'),
    path.join(__dirname, '../../frontend/public/favicon.png'),
  ];
  const windowIcon = iconCandidates.find((p) => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 850,
    minHeight: 650,
    title: 'MAVS — Indian Language Voice Studio',
    backgroundColor: '#FAF0E3',
    icon: windowIcon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Load packaged Vite dist or development fallback
  const rendererPath = path.join(__dirname, 'renderer', 'index.html');
  if (fs.existsSync(rendererPath)) {
    mainWindow.loadFile(rendererPath);
  } else if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links safely in system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 6. IPC Handlers
ipcMain.handle('get-backend-url', () => backendUrl);
ipcMain.handle('get-backend-port', () => allocatedPort);
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('open-external', (_event, url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});

// 7. Application Lifecycle
app.whenReady().then(async () => {
  createWindow();
  await startBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
