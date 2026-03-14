@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0auto_proxy_setup.ps1" -DisableProxy -SetWinHttp
pause
