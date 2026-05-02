#Requires -Version 7
# Tear down the BrainQ stack: kill processes on the dev ports, stop postgres.

$ErrorActionPreference = 'Continue'
$root = Resolve-Path "$PSScriptRoot\..\..\"

foreach ($port in 4201, 5159) {
    $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess |
        Where-Object { $_ -gt 0 } | Sort-Object -Unique
    foreach ($procId in $pids) {
        Write-Host "==> stopping pid $procId on port $port" -ForegroundColor Cyan
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "==> postgres (docker compose down)" -ForegroundColor Cyan
docker compose --project-directory $root down | Out-Host

Write-Host "BrainQ stopped." -ForegroundColor Green
