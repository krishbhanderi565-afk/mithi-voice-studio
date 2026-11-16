@echo off
setlocal EnableDelayedExpansion
title Mithi AI Voice Studio Launcher

echo ===============================================================
echo             MITHI AI VOICE STUDIO -- ONE-CLICK LAUNCHER
echo ===============================================================
echo.

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: 1. Check prerequisites
echo [1/4] Checking environment prerequisites...

if not exist "%PROJECT_ROOT%.venv\Scripts\activate.bat" goto ERR_NO_VENV
if not exist "%PROJECT_ROOT%frontend\package.json" goto ERR_NO_FRONTEND

where node >nul 2>&1
if %errorlevel% neq 0 goto ERR_NO_NODE

where npm >nul 2>&1
if %errorlevel% neq 0 goto ERR_NO_NPM

if not exist "%PROJECT_ROOT%backend\mithi-v1-flash\decoder.safetensors" goto ERR_NO_MODEL

echo [OK] All prerequisites verified successfully.
echo.
goto CHECK_PORTS

:ERR_NO_VENV
echo.
echo [ERROR] Python virtual environment was not found at:
echo         "%PROJECT_ROOT%.venv"
echo.
echo Please create the Python 3.12 environment first using:
echo   py -3.12 -m venv .venv
echo   .\.venv\Scripts\pip install -r backend\requirements.txt
echo.
pause
exit /b 1

:ERR_NO_FRONTEND
echo.
echo [ERROR] Frontend project was not found at:
echo         "%PROJECT_ROOT%frontend"
echo.
pause
exit /b 1

:ERR_NO_NODE
echo.
echo [ERROR] Node.js was not detected in your PATH.
echo Please install Node.js v18 or higher from https://nodejs.org/
echo.
pause
exit /b 1

:ERR_NO_NPM
echo.
echo [ERROR] npm was not detected in your PATH.
echo.
pause
exit /b 1

:ERR_NO_MODEL
echo.
echo [ERROR] Official Mithi v1 Flash model files not found at:
echo         "%PROJECT_ROOT%backend\mithi-v1-flash"
echo.
echo Please download the model using the command in README.md before launching.
echo.
pause
exit /b 1

:CHECK_PORTS
:: 2. Check if ports are already active
echo [2/4] Checking network port availability...

set "BACKEND_RUNNING=0"
set "BACKEND_PID="
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /c:":8000 " ^| findstr "LISTENING"') do (
    set "BACKEND_RUNNING=1"
    set "BACKEND_PID=%%a"
)

set "FRONTEND_RUNNING=0"
set "FRONTEND_PID="
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /c:":5173 " ^| findstr "LISTENING"') do (
    set "FRONTEND_RUNNING=1"
    set "FRONTEND_PID=%%a"
)

if "!BACKEND_RUNNING!"=="1" (
    echo [INFO] Backend is already active on port 8000 ^(PID: !BACKEND_PID!^). Reusing existing server.
) else (
    echo [INFO] Starting Backend Server ^(FastAPI + Mithi v1 Flash^)...
    start "Mithi AI Voice Studio - Backend Server" cmd /k "title Mithi AI Voice Studio - Backend Server & cd /d ""%PROJECT_ROOT%"" & call "".venv\Scripts\activate.bat"" & echo =============================================================== & echo        MITHI AI VOICE STUDIO - BACKEND SERVER ^(CPU MODE^)        & echo        API URL: http://127.0.0.1:8000                           & echo        Docs:    http://127.0.0.1:8000/docs                      & echo =============================================================== & echo. & echo Loading Mithi model into memory and starting Uvicorn... & python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
)

if "!FRONTEND_RUNNING!"=="1" (
    echo [INFO] Frontend is already active on port 5173 ^(PID: !FRONTEND_PID!^). Reusing existing server.
) else (
    echo [INFO] Starting Frontend Dev Server ^(Vite + React^)...
    start "Mithi AI Voice Studio - Frontend Server" cmd /k "title Mithi AI Voice Studio - Frontend Server & cd /d ""%PROJECT_ROOT%frontend"" & echo =============================================================== & echo        MITHI AI VOICE STUDIO - FRONTEND SERVER                  & echo        URL: http://localhost:5173                              & echo =============================================================== & echo. & npm run dev"
)

echo.

:: 3. If both were already running, do not spawn another browser tab
if "!BACKEND_RUNNING!"=="1" if "!FRONTEND_RUNNING!"=="1" (
    echo [INFO] Both services are already active and healthy.
    echo [INFO] Application is available at: http://localhost:5173
    echo [INFO] ^(Skipping browser launch to prevent opening duplicate tabs^).
    echo.
    ping 127.0.0.1 -n 3 >nul
    exit /b 0
)

:: 4. Wait for Frontend to be ready, then open browser
echo [3/4] Waiting for services to initialize...
set "ATTEMPTS=0"
set "MAX_ATTEMPTS=30"

:WAIT_LOOP
ping 127.0.0.1 -n 2 >nul
set /a ATTEMPTS+=1

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 goto LAUNCH_BROWSER

if %ATTEMPTS% geq %MAX_ATTEMPTS% (
    echo.
    echo [WARNING] Frontend did not respond within %MAX_ATTEMPTS% seconds.
    echo Please check the "Mithi AI Voice Studio - Frontend Server" window for logs.
    echo You can manually navigate to: http://localhost:5173
    echo.
    pause
    exit /b 0
)

echo        Still waiting for frontend to become ready ^(%ATTEMPTS%/%MAX_ATTEMPTS%^)...
goto WAIT_LOOP

:LAUNCH_BROWSER
echo.
echo [4/4] Opening Mithi AI Voice Studio in default browser...
start http://localhost:5173

echo.
echo ===============================================================
echo     SUCCESS: Mithi AI Voice Studio is now running!
echo ===============================================================
echo.
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend API:      http://127.0.0.1:8000
echo  - API Docs:         http://127.0.0.1:8000/docs
echo.
echo  Keep both terminal windows open while using the application.
echo  To safely stop all services, run STOP_MITHI.bat.
echo ===============================================================
echo.
ping 127.0.0.1 -n 4 >nul
exit /b 0
