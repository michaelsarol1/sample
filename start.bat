@echo off
cd /d "%~dp0"
title Merkado

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed.
  echo Download it from https://nodejs.org then double-click start.bat again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing packages. This can take a minute...
  call npm install
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)

echo.
echo Merkado will open in your browser.
echo Keep this window open while you use the app.
echo Close this window to stop the server.
echo.
call npm start
pause
