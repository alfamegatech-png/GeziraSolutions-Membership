param(
  [string]$SiteName = "GeziraMembership",
  [string]$AppPoolName = "GeziraMembershipPool",
  [int]$IisPort = 80,
  [string]$IisPath = "C:\inetpub\wwwroot\gezira-membership"
)

$ErrorActionPreference = "Stop"

$serverRoot = Split-Path -Parent $PSScriptRoot
$appcmd = Join-Path $env:windir "System32\inetsrv\appcmd.exe"

if (-not (Test-Path $appcmd)) {
  throw "IIS appcmd.exe was not found. Install IIS first."
}

Write-Host "Building Next.js production bundle..."
Push-Location $serverRoot
npm run build

if (-not (Get-Command pm2.cmd -ErrorAction SilentlyContinue)) {
  Write-Host "Installing PM2 globally..."
  npm install -g pm2
}

Write-Host "Starting or reloading Gezira membership app with PM2..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
Pop-Location

Write-Host "Preparing IIS folder: $IisPath"
New-Item -ItemType Directory -Force -Path $IisPath | Out-Null
Copy-Item -Force -Path (Join-Path $PSScriptRoot "web.config") -Destination (Join-Path $IisPath "web.config")

Write-Host "Ensuring IIS app pool exists..."
& $appcmd list apppool $AppPoolName | Out-Null
if ($LASTEXITCODE -ne 0) {
  & $appcmd add apppool /name:$AppPoolName /managedRuntimeVersion:""
}

Write-Host "Ensuring IIS site exists..."
& $appcmd list site $SiteName | Out-Null
if ($LASTEXITCODE -ne 0) {
  & $appcmd add site /name:$SiteName /bindings:"http/*:${IisPort}:" /physicalPath:$IisPath
}
else {
  & $appcmd set site $SiteName /bindings:"http/*:${IisPort}:"
}

& $appcmd set app "$SiteName/" /applicationPool:$AppPoolName

Write-Host "Enabling ARR proxy if IIS Application Request Routing is installed..."
try {
  & $appcmd set config -section:system.webServer/proxy /enabled:true /commit:apphost
}
catch {
  Write-Warning "Could not enable ARR proxy. Install IIS URL Rewrite + Application Request Routing, then rerun this script."
}

iisreset

Write-Host ""
Write-Host "Done. Open: http://localhost:$IisPort"
Write-Host "Next.js app is running behind IIS on http://127.0.0.1:3001"
