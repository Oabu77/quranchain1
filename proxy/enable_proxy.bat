@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0auto_proxy_setup.ps1" -ProxyHost 192.168.1.50 -ProxyPort 8888 -SetWinHttp
pause
