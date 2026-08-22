@echo off
title FraudShield India - Invoice Fraud Detection and Forensic Audit System
color 0B

:: ============================================================================
:: FraudShield India - One-Click Application Launcher
:: ============================================================================
:: 1. Changes directory to the script's exact folder location (dynamic path).
:: 2. Checks if the backend (Port 5000) or frontend (Port 5173) is already running.
:: 3. If already running, opens the browser directly to prevent duplicate processes.
:: 4. If not running, launches both servers via npm.cmd run dev and opens the browser.
:: ============================================================================

cd /d "%~dp0"

echo ===============================================================================
echo                FRAUDSHIELD INDIA - INVOICE FRAUD DETECTION SYSTEM
echo            Enterprise Rule-Based Fraud Detection and Forensic Audit Platform
echo ===============================================================================
echo.

:: Check if port 5000 (Backend API) or port 5173 (Frontend Client) is already active
netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul 2>&1
set BACKEND_RUNNING=%errorlevel%

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul 2>&1
set FRONTEND_RUNNING=%errorlevel%

if %BACKEND_RUNNING% equ 0 (
    if %FRONTEND_RUNNING% equ 0 (
        echo [*] FraudShield is ALREADY RUNNING:
        echo     - Backend API:  http://localhost:5000/api
        echo     - Frontend Web: http://localhost:5173
        echo.
        echo [*] Opening application in your default web browser...
        start http://localhost:5173
        echo.
        echo Press any key to exit this launcher window...
        pause >nul
        exit /b 0
    )
)

echo [*] Initializing full-stack environment...
echo [*] Working Directory: %CD%
echo.
echo [*] Target URLs:
echo     - Web Application:  http://localhost:5173
echo     - API Server:       http://localhost:5000/api
echo.
echo [*] Default Demo Credentials:
echo     - Administrator: admin@fraudshield.in       / Admin@123
echo     - Auditor (CA):  auditor.sharma@fraudshield.in / Audit@123
echo     - Finance User:  finance.patel@fraudshield.in   / Finance@123
echo.
echo -------------------------------------------------------------------------------
echo [*] Starting Backend and Frontend services via concurrently...
echo [*] Browser will open automatically once services are ready.
echo -------------------------------------------------------------------------------
echo.

:: Launch background helper to wait 4 seconds and open default browser
start "" /b cmd /c "timeout /t 4 /nobreak >nul 2>&1 & start http://localhost:5173"

:: Start the full-stack application (keeps terminal visible with live server logs)
call npm.cmd run dev

:: In case npm finishes or exits
echo.
echo [*] Application process terminated.
pause
