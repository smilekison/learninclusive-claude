$ErrorActionPreference = "Stop"

# LearnInclusive production bootstrap.
# This repository owns the Supabase runtime and derives the browser publishable
# key from the repository-owned Supabase .env. No deployment-platform integration
# is required.

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

$SupabasePublicUrl = if ($env:SUPABASE_PUBLIC_URL) { $env:SUPABASE_PUBLIC_URL } else { "https://supabase.smilekisan.com" }
$SiteUrl = if ($env:SITE_URL) { $env:SITE_URL } else { "https://learn.smilekisan.com" }
$ApiExternalUrl = if ($env:API_EXTERNAL_URL) { $env:API_EXTERNAL_URL } else { $SupabasePublicUrl }
$ProxyDomain = if ($env:PROXY_DOMAIN) { $env:PROXY_DOMAIN } else { "supabase.smilekisan.com" }
$Port = if ($env:LEARNINCLUSIVE_HOST_PORT) { $env:LEARNINCLUSIVE_HOST_PORT } else { "18080" }

$env:SUPABASE_PUBLIC_URL = $SupabasePublicUrl
$env:SITE_URL = $SiteUrl
$env:API_EXTERNAL_URL = $ApiExternalUrl
$env:PROXY_DOMAIN = $ProxyDomain
$env:LEARNINCLUSIVE_HOST_PORT = $Port

Write-Host "== LearnInclusive production deployment =="
Write-Host "Application URL: $SiteUrl"
Write-Host "Supabase URL:    $SupabasePublicUrl"

& (Join-Path $Root "scriptssetup-supabase.ps1")

$EnvFile = Join-Path $Root ".runtimelearninclusive.env"
if (-not (Test-Path $EnvFile)) { throw "Supabase bootstrap did not create $EnvFile" }

$EnvLines = Get-Content $EnvFile
if (-not ($EnvLines -match "^VITE_SUPABASE_URL=")) { throw "VITE_SUPABASE_URL was not generated." }
if (-not ($EnvLines -match "^VITE_SUPABASE_PUBLISHABLE_KEY=")) { throw "VITE_SUPABASE_PUBLISHABLE_KEY was not generated." }

Write-Host "Starting LearnInclusive with the generated Supabase configuration..."
docker compose --env-file $EnvFile up -d --build

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Application: $SiteUrl"
Write-Host "Supabase:    $SupabasePublicUrl"
Write-Host ""
Write-Host "The publishable key was generated/read from the repository-owned"
Write-Host "Supabase environment and written to .runtimelearninclusive.env."
