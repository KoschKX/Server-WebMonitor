@echo off
echo Stopping WebMonitor service...
echo.

REM Kill processes on port 3000
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo Service stopped.
) else (
    echo No service running on port 3000.
)
echo.
