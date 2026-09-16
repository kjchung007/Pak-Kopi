$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$ports = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port
if (3000 -in $ports -or 5173 -in $ports) {
    Write-Output 'A customer preview is already listening. Use its existing window or process rather than starting a duplicate.'
    exit 0
}
$nodePath = (Get-Command node).Source
$launcherPath = Join-Path $PSScriptRoot 'start-apps.mjs'
$logDirectory = Join-Path $projectPath 'artifacts'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$previewProcess = Start-Process -FilePath $nodePath -ArgumentList ('"' + $launcherPath + '"') -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'network-server.log') -RedirectStandardError (Join-Path $logDirectory 'network-server-errors.log') -PassThru
Write-Output "Background preview started (process $($previewProcess.Id)). Network URLs appear in artifacts/network-server.log once ready."
