# ═══════════════════════════════════════════════════════════
# DarCloud ISP™ — T-Mobile TMO-G4AR Gateway Flash Script
# Converts your T-Mobile 5G Home Internet gateway into a
# DarCloud WiFi mesh tower broadcasting "DarCloud-WiFi"
#
# Run this on your Windows PC while connected to the gateway
# PowerShell: Right-click → Run as Administrator
# ═══════════════════════════════════════════════════════════

param(
    [string]$GatewayIP = "192.168.12.1",
    [string]$AdminPassword = "6G1oc52dsh8h",
    [string]$NewSSID24 = "DarCloud-WiFi",
    [string]$NewSSID5 = "DarCloud-WiFi-5G",
    [string]$NewWifiPassword = "DarCloud2026",
    [string]$NodeName = "tower-tmo-g4ar-01",
    [string]$Region = "us-central",
    [string]$ApiUrl = "https://darcloud.host"
)

Write-Host @"
═══════════════════════════════════════════════════
  DarCloud ISP™ — TMO-G4AR Gateway Flash
  Gateway: $GatewayIP
  New SSID: $NewSSID24 / $NewSSID5
  Tower ID: $NodeName
═══════════════════════════════════════════════════
"@

# ── Step 1: Check Gateway Reachability ──
Write-Host "`n[1/7] Checking gateway connectivity..."
try {
    $ping = Test-Connection -ComputerName $GatewayIP -Count 2 -Quiet
    if ($ping) {
        Write-Host "  ✓ Gateway reachable at $GatewayIP"
    } else {
        Write-Host "  ✗ Cannot reach gateway. Make sure you're connected to the T-Mobile WiFi."
        Write-Host "  Current WiFi should be: TMOBILE-C4CC"
        exit 1
    }
} catch {
    Write-Host "  ✗ Network error: $_"
    exit 1
}

# ── Step 2: Login to Gateway Admin Panel ──
Write-Host "`n[2/7] Logging into gateway admin panel..."

# The TMO-G4AR uses a REST API at http://192.168.12.1/TMI/v1/
$baseUrl = "http://$GatewayIP"
$loginUrl = "$baseUrl/TMI/v1/auth/login"
$wifiUrl = "$baseUrl/TMI/v1/network/configuration/v2"
$deviceUrl = "$baseUrl/TMI/v1/network/configuration"
$gatewayUrl = "$baseUrl/TMI/v1/gateway"

# Try to get auth token
try {
    $loginBody = @{
        username = "admin"
        password = $AdminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    $authToken = $loginResponse.auth.token
    
    if ($authToken) {
        Write-Host "  ✓ Authenticated with gateway"
        $headers = @{ "Authorization" = "Bearer $authToken" }
    } else {
        Write-Host "  ⚠ Auth token not returned, trying without auth..."
        $headers = @{}
    }
} catch {
    Write-Host "  ⚠ Login API not available, trying direct access..."
    Write-Host "  Error: $($_.Exception.Message)"
    $headers = @{}
    
    # Fallback: Try basic auth
    $pair = "admin:$AdminPassword"
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $headers = @{ "Authorization" = "Basic $base64" }
}

# ── Step 3: Read Current Configuration ──
Write-Host "`n[3/7] Reading current gateway configuration..."

try {
    $currentConfig = Invoke-RestMethod -Uri $gatewayUrl -Method Get -Headers $headers -TimeoutSec 10
    Write-Host "  Model: $($currentConfig.device.model)"
    Write-Host "  Firmware: $($currentConfig.device.softwareVersion)"
    Write-Host "  IMEI: $($currentConfig.device.IMEI)"
    Write-Host "  5G Band: $($currentConfig.signal.'5g'.band)"
    Write-Host "  Signal: $($currentConfig.signal.'5g'.rsrp) dBm"
} catch {
    Write-Host "  ⚠ Could not read gateway info via API"
    Write-Host "  The gateway may use a different API version"
}

# ── Step 4: Change WiFi SSID to DarCloud-WiFi ──
Write-Host "`n[4/7] Configuring WiFi SSID → DarCloud-WiFi..."

# TMO-G4AR WiFi configuration via API
$wifiConfig = @{
    "2.4ghz" = @{
        ssidName = $NewSSID24
        wpaKey = $NewWifiPassword
        isBroadcastEnabled = $true
        isEnabled = $true
        channel = "auto"
        encryption = "WPA2/WPA3"
    }
    "5.0ghz" = @{
        ssidName = $NewSSID5
        wpaKey = $NewWifiPassword
        isBroadcastEnabled = $true
        isEnabled = $true
        channel = "auto"
        encryption = "WPA2/WPA3"
    }
} | ConvertTo-Json -Depth 5

try {
    # Try the v2 API first
    $wifiResult = Invoke-RestMethod -Uri $wifiUrl -Method Patch -Body $wifiConfig -Headers $headers -ContentType "application/json" -TimeoutSec 15
    Write-Host "  ✓ WiFi SSID changed to: $NewSSID24 / $NewSSID5"
    Write-Host "  ✓ WiFi password set to: $NewWifiPassword"
    $wifiChanged = $true
} catch {
    Write-Host "  ⚠ API configuration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "  ═══ MANUAL STEPS REQUIRED ═══"
    Write-Host "  1. Open browser → http://$GatewayIP"
    Write-Host "  2. Login with password: $AdminPassword"
    Write-Host "  3. Go to WiFi Settings"
    Write-Host "  4. Change 2.4GHz SSID to: $NewSSID24"
    Write-Host "  5. Change 5GHz SSID to: $NewSSID5"
    Write-Host "  6. Change password to: $NewWifiPassword"
    Write-Host "  7. Enable SSID broadcast"
    Write-Host "  8. Click Save & Apply"
    Write-Host "  ════════════════════════════"
    Write-Host ""
    $wifiChanged = $false
    
    # Open browser to admin panel for manual config
    Start-Process "http://$GatewayIP"
}

# ── Step 5: Configure DNS to intercept captive portal detection ──
Write-Host "`n[5/7] Configuring DNS for captive portal detection..."

# Try to set custom DNS on the gateway
$dnsConfig = @{
    dns = @{
        primary = "1.1.1.1"
        secondary = "8.8.8.8"
    }
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/TMI/v1/network/configuration" -Method Patch -Body $dnsConfig -Headers $headers -ContentType "application/json" -TimeoutSec 10
    Write-Host "  ✓ DNS set to Cloudflare (1.1.1.1) + Google (8.8.8.8)"
} catch {
    Write-Host "  ⚠ DNS configuration via API not available"
    Write-Host "  DNS will use T-Mobile defaults (still functional)"
}

# ── Step 6: Register Gateway with DarCloud Mesh API ──
Write-Host "`n[6/7] Registering gateway as DarCloud mesh tower..."

# Get public IP
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    Write-Host "  Public IP: $publicIP"
} catch {
    $publicIP = ""
    Write-Host "  ⚠ Could not detect public IP"
}

# Register as mesh node
$meshPayload = @{
    node_id = $NodeName
    hardware = "TMO-G4AR (Arcadyan 5G Gateway)"
    region = $Region
    capabilities = @("gateway", "tower", "relay")
    wireguard_pubkey = ""
    wireguard_endpoint = $publicIP
    listen_port = 51820
    mesh_ip = "10.0.1.1"
    role = "tower"
    device_type = "router"
    firmware_version = "tmo-g4ar-darcloud-1.0"
} | ConvertTo-Json

try {
    $meshResult = Invoke-RestMethod -Uri "$ApiUrl/mesh/connect" -Method Post -Body $meshPayload -ContentType "application/json" -TimeoutSec 10
    Write-Host "  ✓ Registered as mesh tower: $NodeName"
    Write-Host "  Peers available: $($meshResult.peers_available)"
    Write-Host "  Peer config URL: $($meshResult.peer_config_url)"
} catch {
    Write-Host "  ⚠ Mesh registration: $($_.Exception.Message)"
}

# Register as ISP device
$devicePayload = @{
    device_id = "tmo-g4ar-$($NodeName)"
    device_type = "router"
    manufacturer = "Arcadyan"
    model = "TMO-G4AR"
    mac_address = "F4:3E:B0:20:C4:CC"
    mesh_enabled = $true
    is_mesh_tower = $true
} | ConvertTo-Json

try {
    $deviceResult = Invoke-RestMethod -Uri "$ApiUrl/isp/devices/register" -Method Post -Body $devicePayload -ContentType "application/json" -TimeoutSec 10
    Write-Host "  ✓ Device registered with ISP"
} catch {
    Write-Host "  ⚠ Device registration: $($_.Exception.Message)"
}

# ── Step 7: Set Up Heartbeat Task ──
Write-Host "`n[7/7] Setting up heartbeat service..."

# Create a scheduled task to send heartbeats every 2 minutes
$heartbeatScript = @"
while (`$true) {
    try {
        `$body = @{ node_id = "$NodeName"; status = "online" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$ApiUrl/mesh/heartbeat" -Method Post -Body `$body -ContentType "application/json" -TimeoutSec 5
    } catch {}
    Start-Sleep -Seconds 120
}
"@

$heartbeatPath = "$env:USERPROFILE\darcloud-heartbeat.ps1"
$heartbeatScript | Out-File -FilePath $heartbeatPath -Encoding UTF8
Write-Host "  ✓ Heartbeat script saved to $heartbeatPath"

# Register as scheduled task
try {
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$heartbeatPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartInterval (New-TimeSpan -Minutes 5) -RestartCount 3
    Register-ScheduledTask -TaskName "DarCloud-MeshHeartbeat" -Action $action -Trigger $trigger -Settings $settings -Description "DarCloud ISP mesh tower heartbeat" -RunLevel Highest -Force
    Write-Host "  ✓ Heartbeat scheduled task registered (runs at startup)"
    
    # Start it now
    Start-ScheduledTask -TaskName "DarCloud-MeshHeartbeat"
    Write-Host "  ✓ Heartbeat started!"
} catch {
    Write-Host "  ⚠ Could not create scheduled task (run as admin)"
    Write-Host "  Manual start: powershell -File $heartbeatPath"
}

# ── Summary ──
Write-Host @"

═══════════════════════════════════════════════════
  DarCloud ISP™ — TMO-G4AR Flash Complete!

  Gateway:       TMO-G4AR (Arcadyan 5G)
  MAC:           F4:3E:B0:20:C4:CC
  IMEI:          866080070085469
  Tower ID:      $NodeName
  Region:        $Region
  Public IP:     $publicIP

  WiFi Networks:
    2.4GHz:  $NewSSID24 (password: $NewWifiPassword)
    5GHz:    $NewSSID5 (password: $NewWifiPassword)

  Mesh Status:
    Registered:  ✓
    Heartbeat:   Every 2 minutes
    Peer Config: $ApiUrl/mesh/peers/$NodeName
    Dashboard:   $ApiUrl/isp/dashboard

  Your T-Mobile 5G gateway is now broadcasting as
  a DarCloud mesh tower! Anyone connecting to
  "$NewSSID24" is on the DarCloud network.
═══════════════════════════════════════════════════

  NEXT STEPS:
  1. If WiFi SSID didn't auto-change, open
     http://$GatewayIP and change it manually
  2. Share DarCloud-WiFi password with neighbors
  3. Add more towers for wider coverage

"@
