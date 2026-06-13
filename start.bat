@echo off
echo Starting System Monitor...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Building Docker image...
docker-compose build

echo.
echo Starting container...
docker-compose up -d

echo.
echo Waiting for service to start...
timeout /t 3 >nul

REM Check if container is running
docker ps | findstr system-monitor >nul
if %errorlevel% == 0 (
    echo.
    echo [SUCCESS] System Monitor is running!
    echo.
    echo Access the dashboard at:
    echo   http://localhost:3000
    echo.
    echo Useful commands:
    echo   View logs:  docker-compose logs -f
    echo   Stop:       docker-compose down
    echo   Restart:    docker-compose restart
    echo.
) else (
    echo.
    echo [ERROR] Failed to start the container. Check logs with:
    echo   docker-compose logs
    echo.
)

pause
