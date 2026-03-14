param(
    [string]$ProxyHost = "127.0.0.1",
    [int]$ProxyPort = 8888,
    [string]$BypassList = "localhost;127.*;10.*;192.168.*;<local>",
    [switch]$DisableProxy,
    [switch]$SetWinHttp,
    [switch]$ShowStatus
)

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

function Set-SystemProxy {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Bypass
    )

    $proxyServer = "$Host`:$Port"

    Write-Host "Enabling Windows proxy: $proxyServer" -ForegroundColor Cyan

    Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 1
    Set-ItemProperty -Path $regPath -Name ProxyServer -Value $proxyServer
    Set-ItemProperty -Path $regPath -Name ProxyOverride -Value $Bypass

    Write-Host "Windows user proxy enabled." -ForegroundColor Green
    Write-Host "ProxyServer   = $proxyServer"
    Write-Host "ProxyOverride = $Bypass"
}

function Disable-SystemProxy {
    Write-Host "Disabling Windows proxy..." -ForegroundColor Yellow
    Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 0
    Remove-ItemProperty -Path $regPath -Name ProxyServer -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $regPath -Name ProxyOverride -ErrorAction SilentlyContinue
    Write-Host "Windows user proxy disabled." -ForegroundColor Green
}

function Set-WinHttpProxy {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Bypass
    )

    $proxyServer = "$Host`:$Port"
    Write-Host "Configuring WinHTTP proxy: $proxyServer" -ForegroundColor Cyan

    $bypassForNetsh = $Bypass -replace ";", ","

    Start-Process -FilePath "netsh" `
        -ArgumentList "winhttp set proxy proxy-server=`"$proxyServer`" bypass-list=`"$bypassForNetsh`"" `
        -Verb RunAs -Wait

    Write-Host "WinHTTP proxy set." -ForegroundColor Green
}

function Reset-WinHttpProxy {
    Write-Host "Resetting WinHTTP proxy..." -ForegroundColor Yellow
    Start-Process -FilePath "netsh" `
        -ArgumentList "winhttp reset proxy" `
        -Verb RunAs -Wait
    Write-Host "WinHTTP proxy reset." -ForegroundColor Green
}

function Show-ProxyStatus {
    Write-Host "`n=== Current User Proxy Settings ===" -ForegroundColor Magenta
    try {
        $settings = Get-ItemProperty -Path $regPath
        Write-Host ("ProxyEnable   : " + $settings.ProxyEnable)
        Write-Host ("ProxyServer   : " + $settings.ProxyServer)
        Write-Host ("ProxyOverride : " + $settings.ProxyOverride)
    }
    catch {
        Write-Host "Could not read user proxy settings."
    }

    Write-Host "`n=== WinHTTP Proxy Settings ===" -ForegroundColor Magenta
    netsh winhttp show proxy
}

if ($ShowStatus) {
    Show-ProxyStatus
    exit 0
}

if ($DisableProxy) {
    Disable-SystemProxy
    if ($SetWinHttp) {
        Reset-WinHttpProxy
    }
    exit 0
}

Set-SystemProxy -Host $ProxyHost -Port $ProxyPort -Bypass $BypassList

if ($SetWinHttp) {
    Set-WinHttpProxy -Host $ProxyHost -Port $ProxyPort -Bypass $BypassList
}

Write-Host "`nDone." -ForegroundColor Green
Write-Host "You may need to reopen apps for them to pick up the new proxy settings."
