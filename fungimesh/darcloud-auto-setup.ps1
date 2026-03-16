# ═══════════════════════════════════════════════════════════
# DarCloud ISP™ — One-Click Auto-Setup for Windows
# Runs on boot: configures gateway, starts tunnel, heartbeat
# Double-click this file or add to Startup folder
# ═══════════════════════════════════════════════════════════

param(
    [string]$GatewayIP = "192.168.12.1",
    [string]$AdminPassword = $env:DARCLOUD_GW_PASSWORD,
    [string]$WifiPassword = $env:DARCLOUD_WIFI_PASSWORD,
    [string]$NodeId = "tower-tmo-g4ar-c4cc",
    [string]$Region = "us-west",
    [string]$ApiUrl = "https://darcloud.host"
)

if (-not $AdminPassword) {
    $AdminPassword = Read-Host "Enter gateway admin password"
}
if (-not $WifiPassword) {
    $WifiPassword = Read-Host "Enter WiFi password for DarCloud-WiFi"
}

$ErrorActionPreference = "Continue"
$darcloudDir = "$env:USERPROFILE\DarCloud"
$logFile = "$darcloudDir\darcloud-setup.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

# Create DarCloud directory
if (!(Test-Path $darcloudDir)) { New-Item -ItemType Directory -Path $darcloudDir -Force | Out-Null }

Log "═══ DarCloud ISP Auto-Setup Starting ═══"

# ── Step 1: Install cloudflared if needed ──
$cfPath = "$darcloudDir\cloudflared.exe"
if (!(Test-Path $cfPath)) {
    Log "Downloading cloudflared..."
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfPath -TimeoutSec 60
        Log "cloudflared installed"
    } catch {
        Log "ERROR: Could not download cloudflared: $_"
    }
}

# ── Step 2: Configure TMO-G4AR Gateway ──
Log "Checking gateway at 192.168.12.1..."
$gwReachable = Test-Connection -ComputerName "192.168.12.1" -Count 1 -Quiet -ErrorAction SilentlyContinue
if ($gwReachable) {
    Log "Gateway reachable — configuring WiFi SSID..."
    try {
        $cred = @{ username = "admin"; password = $AdminPassword } | ConvertTo-Json
        $login = Invoke-RestMethod -Uri "http://192.168.12.1/TMI/v1/auth/login" -Method Post -Body $cred -ContentType "application/json" -TimeoutSec 10
        $headers = @{ "Authorization" = "Bearer $($login.auth.token)" }

        $wifi = @{
            "2.4ghz" = @{ ssidName = "DarCloud-WiFi"; wpaKey = $WifiPassword; isBroadcastEnabled = $true; isEnabled = $true }
            "5.0ghz" = @{ ssidName = "DarCloud-WiFi-5G"; wpaKey = $WifiPassword; isBroadcastEnabled = $true; isEnabled = $true }
        } | ConvertTo-Json -Depth 3

        Invoke-RestMethod -Uri "http://192.168.12.1/TMI/v1/network/configuration/v2" -Method Patch -Body $wifi -Headers $headers -ContentType "application/json" -TimeoutSec 15
        Log "WiFi SSID changed to DarCloud-WiFi"
    } catch {
        Log "Gateway API config failed (manual change may be needed): $_"
    }
} else {
    Log "Gateway not reachable on 192.168.12.1 — skipping WiFi config"
}

# ── Step 3: Start Cloudflare Tunnel (permanent) ──
Log "Starting Cloudflare Tunnel..."
$tunnelProcess = $null

# Expose gateway admin (192.168.12.1) so Codespace can reach it
if (Test-Path $cfPath) {
    # Kill any existing tunnel
    Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Start tunnel in background — exposes gateway to Cloudflare
    $tunnelLog = "$darcloudDir\tunnel.log"
    $tunnelProcess = Start-Process -FilePath $cfPath -ArgumentList "tunnel", "--url", "http://192.168.12.1", "--logfile", $tunnelLog -PassThru -WindowStyle Hidden

    # Wait for tunnel URL to appear in log
    Start-Sleep -Seconds 8
    if (Test-Path $tunnelLog) {
        $tunnelUrl = (Select-String -Path $tunnelLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1)
        if ($tunnelUrl) {
            $url = $tunnelUrl.Matches[0].Value
            Log "Tunnel LIVE: $url"

            # Report tunnel URL to DarCloud API so Codespace can use it
            try {
                $report = @{
                    node_id = $NodeId
                    tunnel_url = $url
                    status = "tunnel_active"
                    public_ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5)
                } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ApiUrl/mesh/heartbeat" -Method Post -Body $report -ContentType "application/json" -TimeoutSec 10
                Log "Tunnel URL reported to DarCloud API"
            } catch {
                Log "Could not report tunnel URL: $_"
            }
        } else {
            Log "Tunnel started but URL not yet available"
        }
    }
} else {
    Log "cloudflared not found — tunnel not started"
}

# ── Step 4: Register with mesh API ──
Log "Registering with DarCloud mesh..."
try {
    $ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    $mesh = @{
        node_id = $NodeId
        hardware = "TMO-G4AR (Arcadyan 5G Gateway)"
        region = $Region
        capabilities = @("gateway", "tower", "relay")
        wireguard_endpoint = $ip
        listen_port = 51820
        mesh_ip = "10.0.1.1"
        role = "tower"
        device_type = "router"
        firmware_version = "tmo-g4ar-darcloud-1.0"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$ApiUrl/mesh/connect" -Method Post -Body $mesh -ContentType "application/json" -TimeoutSec 10
    Log "Registered as mesh tower (IP: $ip)"
} catch {
    Log "Mesh registration: $_"
}

# ── Step 5: Heartbeat loop (runs forever) ──
Log "Starting heartbeat loop (every 2 minutes)..."
while ($true) {
    try {
        $hb = @{ node_id = $NodeId; status = "online" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$ApiUrl/mesh/heartbeat" -Method Post -Body $hb -ContentType "application/json" -TimeoutSec 5 | Out-Null
    } catch {}

    # Check if tunnel is still running, restart if needed
    if ($tunnelProcess -and $tunnelProcess.HasExited -and (Test-Path $cfPath)) {
        Log "Tunnel died — restarting..."
        $tunnelProcess = Start-Process -FilePath $cfPath -ArgumentList "tunnel", "--url", "http://192.168.12.1", "--logfile", "$darcloudDir\tunnel.log" -PassThru -WindowStyle Hidden
    }

    Start-Sleep -Seconds 120
}
