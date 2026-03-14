$TestHost = "8.8.8.8"
$WifiName = (netsh wlan show interfaces | Select-String "SSID" | Select-Object -First 1).ToString().Split(":")[1].Trim()
$Adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1

Write-Host "Monitoring connection..."
Write-Host "WiFi: $WifiName"
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
            netsh wlan connect name="$WifiName"
        }

        Start-Sleep 5

        # restart adapter
        Disable-NetAdapter -Name $Adapter.Name -Confirm:$false
        Start-Sleep 3
        Enable-NetAdapter -Name $Adapter.Name -Confirm:$false

        Start-Sleep 10
    }

    Start-Sleep 15
}
