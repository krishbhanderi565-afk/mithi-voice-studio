@echo off
setlocal enabledelayedexpansion
title Stop Mithi AI Voice Studio

echo ===============================================================
echo          STOPPING MITHI AI VOICE STUDIO SERVICES
echo ===============================================================
echo.

set "STOPPED_ANY=0"

:: 1. Terminate service on port 8000 (Backend)
echo [1/2] Checking port 8000 (Backend)...
set "BACKEND_PID="
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /c:":8000 " ^| findstr "LISTENING"') do (
    set "BACKEND_PID=%%a"
)

if defined BACKEND_PID (
    echo [INFO] Found Backend process on port 8000 with PID !BACKEND_PID!.
    echo [INFO] Terminating Backend process tree...
    taskkill /F /T /PID !BACKEND_PID! >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend service stopped successfully.
        set "STOPPED_ANY=1"
    ) else (
        echo [WARNING] Could not terminate process !BACKEND_PID! directly.
    )
) else (
    echo [INFO] No active backend server found on port 8000.
)

echo.

:: 2. Terminate service on port 5173 (Frontend)
echo [2/2] Checking port 5173 (Frontend)...
set "FRONTEND_PID="
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /c:":5173 " ^| findstr "LISTENING"') do (
    set "FRONTEND_PID=%%a"
)

if defined FRONTEND_PID (
    echo [INFO] Found Frontend process on port 5173 with PID !FRONTEND_PID!.
    echo [INFO] Terminating Frontend process tree...
    taskkill /F /T /PID !FRONTEND_PID! >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend service stopped successfully.
        set "STOPPED_ANY=1"
    ) else (
        echo [WARNING] Could not terminate process !FRONTEND_PID! directly.
    )
) else (
    echo [INFO] No active frontend server found on port 5173.
)

echo.
echo ===============================================================
if "!STOPPED_ANY!"=="1" (
    echo   All Mithi AI Voice Studio services have been stopped.
) else (
    echo   No running Mithi Voice Studio services were found.
)
echo ===============================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
