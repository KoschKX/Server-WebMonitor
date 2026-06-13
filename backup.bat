@echo off
setlocal enabledelayedexpansion

echo Creating backup...
echo.

REM Create backup directory if it doesn't exist
if not exist "_BACKUP\" mkdir _BACKUP

REM Generate timestamp for filename
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a%%b)
set mytime=%mytime::=%
set TIMESTAMP=%mydate%_%mytime%
set FILENAME=webmonitor-%TIMESTAMP%.zip

echo Backup file: _BACKUP\%FILENAME%
echo.

REM Create zip file using PowerShell - backup everything except excluded folders
powershell -Command "$exclude = @('.claude', '_BACKUP', 'node_modules'); Get-ChildItem -Path . | Where-Object { $_.Name -notin $exclude } | Compress-Archive -DestinationPath '_BACKUP\%FILENAME%' -Force -CompressionLevel Optimal"

if %errorlevel% == 0 (
    echo.
    echo [SUCCESS] Backup created successfully at _BACKUP\%FILENAME%
) else (
    echo.
    echo [ERROR] Backup failed!
    exit /b 1
)

echo.
