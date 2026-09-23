$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is required." }
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw "npx is required." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop is required." }

Write-Host "Starting the repository Supabase project with Docker Desktop..."
npx --yes supabase@latest start

$status = npx --yes supabase@latest status -o env
$api = ($status | Where-Object { $_ -match "^API_URL=" } | Select-Object -First 1) -replace "^API_URL=",""
$anon = ($status | Where-Object { $_ -match "^ANON_KEY=" } | Select-Object -First 1) -replace "^ANON_KEY=",""
if (-not $api) { throw "Supabase API_URL was not returned." }
if (-not $anon) { throw "Supabase ANON_KEY was not returned." }

$envFile = ".runtime-learninclusive.env"
@("VITE_SUPABASE_URL=$api","VITE_SUPABASE_PUBLISHABLE_KEY=$anon","LEARNINCLUSIVE_HOST_PORT=18080") | Set-Content $envFile -Encoding utf8
docker compose --env-file $envFile up -d --build
Remove-Item $envFile -Force

Write-Host ""
Write-Host "LearnInclusive: http://localhost:18080"
Write-Host "Supabase API:  $api"
Write-Host "Supabase Studio: http://127.0.0.1:54323"
