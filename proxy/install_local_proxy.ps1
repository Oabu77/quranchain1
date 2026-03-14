param(
    [int]$ProxyPort = 8888,
    [string]$InstallDir = "C:\3proxy",
    [switch]$SetWinHttp,
    [switch]$AllowLAN,
    [string]$ListenIP = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

# Latest stable release shown on GitHub at the time of writing:
# https://github.com/3proxy/3proxy/releases/tag/0.9.5
$Version = "0.9.5"
$ZipUrl  = "https://github.com/3proxy/3proxy/releases/download/$Version/3proxy-$Version-x64.zip"

if ($AllowLAN -and $ListenIP -eq "127.0.0.1") {
    $ListenIP = "0.0.0.0"
}

$ProxyServer = "http://127.0.0.1:$ProxyPort"
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
$ZipPath = Join-Path $env:TEMP "3proxy-$Version-x64.zip"
$ExtractDir = Join-Path $InstallDir "current"
$ExePath = Join-Path $ExtractDir "bin\3proxy.exe"
$CfgPath = Join-Path $InstallDir "3proxy.cfg"
$LogDir = Join-Path $InstallDir "logs"
$TaskName = "Local3ProxyAutoStart"

function Require-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run this script in an elevated PowerShell window (Run as Administrator)."
    }
}

function Ensure-Directory([string]$Path) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Download-3Proxy {
    Write-Host "Downloading 3proxy $Version..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath
}

function Extract-3Proxy {
    Write-Host "Extracting files..." -ForegroundColor Cyan

    if (Test-Path $ExtractDir) {
        Remove-Item $ExtractDir -Recurse -Force
    }

    Ensure-Directory $ExtractDir
    Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

    if (-not (Test-Path $ExePath)) {
        $found = Get-ChildItem -Path $ExtractDir -Recurse -Filter "3proxy.exe" | Select-Object -First 1
        if (-not $found) {
            throw "3proxy.exe was not found after extraction."
        }
        $script:ExePath = $found.FullName
    }
}

function Write-Config {
    Write-Host "Writing proxy config..." -ForegroundColor Cyan

    Ensure-Directory $InstallDir
    Ensure-Directory $LogDir

    # By default: local-only on 127.0.0.1, no LAN exposure.
    # If -AllowLAN is used, it listens on 0.0.0.0 and opens Windows Firewall below.
    $config = @"
daemon
nserver 1.1.1.1
nserver 8.8.8.8
nscache 65536
timeouts 1 5 30 60 180 1800 15 60
log "$LogDir\3proxy.log" D
rotate 7
auth none
allow *
proxy -p$ProxyPort -i$ListenIP
flush
"@

    Set-Content -Path $CfgPath -Value $config -Encoding ASCII
}

function Stop-ExistingProxy {
    Get-Process -Name "3proxy" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-Proxy {
    Write-Host "Starting local proxy..." -ForegroundColor Cyan
    Stop-ExistingProxy
    Start-Process -FilePath $ExePath -ArgumentList $CfgPath -WindowStyle Hidden
    Start-Sleep -Seconds 2

    $listening = Get-NetTCPConnection -LocalPort $ProxyPort -State Listen -ErrorAction SilentlyContinue
    if (-not $listening) {
        throw "Proxy did not start listening on port $ProxyPort."
    }
}

function Set-WindowsProxy {
    Write-Host "Configuring Windows user proxy..." -ForegroundColor Cyan

    Set-ItemProperty -Path $RegPath -Name ProxyEnable -Value 1
    Set-ItemProperty -Path $RegPath -Name ProxyServer -Value "127.0.0.1:$ProxyPort"
    Set-ItemProperty -Path $RegPath -Name ProxyOverride -Value "localhost;127.*;10.*;192.168.*;<local>"

    # Notify Windows apps about settings change
    $signature = @"
using System;
using System.Runtime.InteropServices;
public class WinInet {
    [DllImport("wininet.dll", SetLastError=true)]
    public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
}
"@
    Add-Type $signature -ErrorAction SilentlyContinue | Out-Null
    [WinInet]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0) | Out-Null
    [WinInet]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0) | Out-Null
}

function Set-WinHttpProxy {
    Write-Host "Syncing WinHTTP from Windows proxy settings..." -ForegroundColor Cyan
    & netsh winhttp import proxy source=ie | Out-Null
}

function Open-FirewallIfNeeded {
    if ($AllowLAN) {
        Write-Host "Opening Windows Firewall for TCP $ProxyPort..." -ForegroundColor Yellow
        $ruleName = "Local 3proxy TCP $ProxyPort"
        $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if (-not $existing) {
            New-NetFirewallRule -DisplayName $ruleName `
                -Direction Inbound `
                -Action Allow `
                -Protocol TCP `
                -LocalPort $ProxyPort | Out-Null
        }
    }
}

function Register-StartupTask {
    Write-Host "Registering startup task..." -ForegroundColor Cyan

    $action = New-ScheduledTaskAction -Execute $ExePath -Argument $CfgPath
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
}

function Test-Proxy {
    Write-Host "Testing proxy..." -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest -Uri "https://api.ipify.org" -Proxy $ProxyServer -UseBasicParsing -TimeoutSec 20
        Write-Host "Proxy test succeeded. Public IP via proxy: $($resp.Content)" -ForegroundColor Green
    }
    catch {
        Write-Warning "Proxy started, but the test request failed. Check firewall, DNS, antivirus, or outbound connectivity."
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "=== Local Proxy Ready ===" -ForegroundColor Green
    Write-Host "Proxy URL     : $ProxyServer"
    Write-Host "Listen IP     : $ListenIP"
    Write-Host "Install Dir   : $InstallDir"
    Write-Host "Config File   : $CfgPath"
    Write-Host "Executable    : $ExePath"
    Write-Host "Startup Task  : $TaskName"
    Write-Host ""
    Write-Host "Windows apps should now use: 127.0.0.1:$ProxyPort"
    Write-Host ""
    Write-Host "Manual test:"
    Write-Host "  curl.exe --proxy 127.0.0.1:$ProxyPort https://api.ipify.org"
    Write-Host ""
    Write-Host "Disable Windows proxy later with:"
    Write-Host '  Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0'
}

Require-Admin
Ensure-Directory $InstallDir
Download-3Proxy
Extract-3Proxy
Write-Config
Open-FirewallIfNeeded
Start-Proxy
Set-WindowsProxy

if ($SetWinHttp) {
    Set-WinHttpProxy
}

Register-StartupTask
Test-Proxy
Show-Status
