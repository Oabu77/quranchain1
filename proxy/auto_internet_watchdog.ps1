$TestHost = "8.8.8.8"

# Check admin privileges (needed for adapter restart)
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "WARNING: Running without admin. Adapter restart will be skipped if internet drops."
}

# Detect current WiFi network
$wifiLine = netsh wlan show interfaces | Select-String "^\s+SSID\s+:" | Select-Object -First 1
if ($wifiLine) {
    $WifiName = ($wifiLine.ToString() -split ":\s*", 2)[1].Trim()
} else {
    $WifiName = $null
}

$Adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1
if (-not $Adapter) {
    Write-Host "ERROR: No active network adapter found."
    exit 1
}

Write-Host "Monitoring connection..."
Write-Host "WiFi: $(if ($WifiName) { $WifiName } else { '(not detected)' })"
Write-Host "Adapter: $($Adapter.Name)"

while ($true) {

    $connected = Test-Connection -ComputerName $TestHost -Count 1 -Quiet

    if ($connected) {

        Write-Host "$(Get-Date) Internet OK"
    }

    else {

        Write-Host "$(Get-Date) Internet LOST — attempting recovery..."

        # reconnect wifi
        if ($WifiName) {
            netsh wlan connect name="$WifiName" 2>$null
        }

        Start-Sleep 5

        # restart adapter (requires admin)
        try {
            Disable-NetAdapter -Name $Adapter.Name -Confirm:$false -ErrorAction Stop
            Start-Sleep 3
            Enable-NetAdapter -Name $Adapter.Name -Confirm:$false -ErrorAction Stop
        } catch {
            Write-Host "$(Get-Date) Adapter restart failed (run as admin): $($_.Exception.Message)"
        }

        Start-Sleep 10
    }

    Start-Sleep 15
}
