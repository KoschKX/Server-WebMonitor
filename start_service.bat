@echo off
echo Starting System Monitor service...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting service...
start "WebMonitor" node server_win.js

timeout /t 2 >nul
echo.
echo [SUCCESS] WebMonitor service started!
echo Access at: http://localhost:3000
echo.
echo Check the "WebMonitor" window for any error messages.
echo.
