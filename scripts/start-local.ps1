$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root
& (Join-Path $PSScriptRoot "setup-supabase.ps1")
docker compose --env-file ".runtime\learninclusive.env" up -d --build
Write-Host ""
Write-Host "LearnInclusive: http://localhost:18080"
Write-Host "Supabase:       http://localhost:8000"
