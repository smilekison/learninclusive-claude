$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Runtime = Join-Path $Root ".runtime"
$Supabase = Join-Path $Runtime "supabase"
$Source = Join-Path $Runtime "supabase-source"
$Ref = if ($env:SUPABASE_REF) { $env:SUPABASE_REF } else { "self-hosted/v0.8.1" }
$PublicUrl = if ($env:SUPABASE_PUBLIC_URL) { $env:SUPABASE_PUBLIC_URL } else { "http://localhost:8000" }
$SiteUrl = if ($env:SITE_URL) { $env:SITE_URL } else { "http://localhost:18080" }
$ApiUrl = if ($env:API_EXTERNAL_URL) { $env:API_EXTERNAL_URL } else { $PublicUrl }
$ProxyDomain = if ($env:PROXY_DOMAIN) { $env:PROXY_DOMAIN } else { "localhost" }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is required." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop is required." }
docker compose version | Out-Null
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
if (-not (Test-Path (Join-Path $Supabase "docker-compose.yml"))) {
  Remove-Item $Supabase, $Source -Recurse -Force -ErrorAction SilentlyContinue
  git clone --depth 1 --branch $Ref https://github.com/supabase/supabase.git $Source
  New-Item -ItemType Directory -Force -Path $Supabase | Out-Null
  Copy-Item (Join-Path $Source "docker\*") $Supabase -Recurse -Force
  Remove-Item $Source -Recurse -Force
}
Set-Location $Supabase
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
docker run --rm -v "$($Supabase):/work" -w /work alpine:3.22 sh -c "apk add --no-cache openssl >/dev/null && sh utils/generate-keys.sh --update-env && if [ -x utils/add-new-auth-keys.sh ]; then sh utils/add-new-auth-keys.sh; fi"
function Set-EnvValue($key, $value) {
  $path = Join-Path $Supabase ".env"
  $lines = Get-Content $path
  $found = $false
  $out = foreach ($line in $lines) { if ($line -match "^$([regex]::Escape($key))=") { $found = $true; "$key=$value" } else { $line } }
  if (-not $found) { $out += "$key=$value" }
  Set-Content -Path $path -Value $out -Encoding utf8
}
Set-EnvValue "SUPABASE_PUBLIC_URL" $PublicUrl
Set-EnvValue "API_EXTERNAL_URL" $ApiUrl
Set-EnvValue "SITE_URL" $SiteUrl
Set-EnvValue "PROXY_DOMAIN" $ProxyDomain
docker compose pull
docker compose up -d --wait
$publishable = (Get-Content ".env" | Where-Object { $_ -match "^SUPABASE_PUBLISHABLE_KEY=" } | Select-Object -First 1) -replace "^SUPABASE_PUBLISHABLE_KEY=",""
if (-not $publishable) { $publishable = (Get-Content ".env" | Where-Object { $_ -match "^ANON_KEY=" } | Select-Object -First 1) -replace "^ANON_KEY=","" }
if (-not $publishable) { throw "Could not find SUPABASE_PUBLISHABLE_KEY or ANON_KEY." }
$AppEnv = Join-Path $Runtime "learninclusive.env"
@("VITE_SUPABASE_URL=$PublicUrl","VITE_SUPABASE_PUBLISHABLE_KEY=$publishable","LEARNINCLUSIVE_HOST_PORT=$(if ($env:LEARNINCLUSIVE_HOST_PORT) {$env:LEARNINCLUSIVE_HOST_PORT} else {"18080"})") | Set-Content $AppEnv -Encoding utf8
Write-Host "Supabase is running in Docker Desktop."
Write-Host "Supabase: $PublicUrl"
Write-Host "Start app with: docker compose --env-file .runtime\learninclusive.env up -d --build"
