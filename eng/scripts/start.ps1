#Requires -Version 7
# Bring up the full BrainQ stack: postgres, backend API, frontend dev server.
# Idempotent — safe to re-run; existing services are reused.

$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot\..\..\"

Write-Host "==> postgres (docker compose)" -ForegroundColor Cyan
docker compose --project-directory $root up -d | Out-Host

Write-Host "==> waiting for db to be healthy"
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    $health = docker inspect brainq-db --format '{{.State.Health.Status}}' 2>$null
    if ($health -eq 'healthy') { break }
    Start-Sleep -Milliseconds 500
}
if ($health -ne 'healthy') { throw "brainq-db did not become healthy" }

Write-Host "==> applying EF migrations" -ForegroundColor Cyan
dotnet ef database update --project "$root\backend\src\BrainQ.Api\BrainQ.Api.csproj" | Out-Host

function Test-PortBusy($port) {
    [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

if (Test-PortBusy 5159) {
    Write-Host "==> backend already on http://localhost:5159 — skipping" -ForegroundColor Yellow
} else {
    Write-Host "==> backend (http://localhost:5159)" -ForegroundColor Cyan
    Start-Process pwsh -ArgumentList '-NoLogo','-NoProfile','-Command',"dotnet run --project `"$root\backend\src\BrainQ.Api`"" -WindowStyle Hidden
}

if (Test-PortBusy 4201) {
    Write-Host "==> frontend already on http://localhost:4201 — skipping" -ForegroundColor Yellow
} else {
    Write-Host "==> frontend (http://localhost:4201)" -ForegroundColor Cyan
    Start-Process pwsh -ArgumentList '-NoLogo','-NoProfile','-Command',"npm --prefix `"$root\frontend`" start -- --port 4201" -WindowStyle Hidden
}

Write-Host ""
Write-Host "BrainQ is starting. Tail logs in the spawned PowerShell windows; stop with eng\scripts\stop.ps1." -ForegroundColor Green
