@echo off
title CertifiGen - Launcher
color 0A

echo.
echo  ============================================
echo   CertifiGen - Bulk E-Certificate Generator
echo  ============================================
echo.
echo  [1/2] Starting Backend API (port 5000)...
start "CertifiGen Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo  [2/2] Starting Frontend (port 5173)...
start "CertifiGen Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo  ============================================
echo   Both servers are starting up!
echo  ------------------------------------------
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo  ============================================
echo.
echo  Open your browser at: http://localhost:5173
echo.
echo  Press any key to open the app in browser...
pause >nul

start "" "http://localhost:5173"
