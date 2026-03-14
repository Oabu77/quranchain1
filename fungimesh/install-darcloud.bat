@echo off
REM ═══════════════════════════════════════════════════
REM DarCloud ISP™ — Install Auto-Setup to Windows Startup
REM Double-click this to install. Runs on every boot.
REM ═══════════════════════════════════════════════════

echo ╔═══════════════════════════════════════════════╗
echo ║  DarCloud ISP™ — Installing Auto-Setup       ║
echo ╚═══════════════════════════════════════════════╝

REM Create DarCloud directory
if not exist "%USERPROFILE%\DarCloud" mkdir "%USERPROFILE%\DarCloud"

REM Copy the setup script
copy /Y "%~dp0darcloud-auto-setup.ps1" "%USERPROFILE%\DarCloud\darcloud-auto-setup.ps1"

REM Create startup shortcut
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo Set lnk = WshShell.CreateShortcut("%STARTUP%\DarCloud-AutoSetup.lnk"^)
echo lnk.TargetPath = "powershell.exe"
echo lnk.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File ""%USERPROFILE%\DarCloud\darcloud-auto-setup.ps1"""
echo lnk.WorkingDirectory = "%USERPROFILE%\DarCloud"
echo lnk.Description = "DarCloud ISP Auto-Setup - Gateway + Tunnel + Heartbeat"
echo lnk.Save
) > "%TEMP%\darcloud-shortcut.vbs"
cscript //nologo "%TEMP%\darcloud-shortcut.vbs"
del "%TEMP%\darcloud-shortcut.vbs"

echo.
echo  Installed! DarCloud auto-setup will run on every boot.
echo  It will:
echo    1. Configure TMO-G4AR gateway SSID to DarCloud-WiFi
echo    2. Start Cloudflare tunnel for remote access
echo    3. Register as mesh tower
echo    4. Send heartbeats every 2 minutes
echo.
echo  Starting now...
echo.

powershell -ExecutionPolicy Bypass -File "%USERPROFILE%\DarCloud\darcloud-auto-setup.ps1"
