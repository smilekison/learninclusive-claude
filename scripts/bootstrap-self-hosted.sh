#!/bin/sh
set -eu

# One-command Linux bootstrap for LearnInclusive + the official self-hosted
# Supabase Docker distribution.
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
SUPABASE_DIR="$RUNTIME_DIR/supabase"
APP_ENV="$ROOT_DIR/.env"
APP_DOMAIN="${APP_DOMAIN:-learn.smilekisan.com}"
SUPABASE_DOMAIN="${SUPABASE_DOMAIN:-supabase.smilekisan.com}"
APP_PORT="${LEARNINCLUSIVE_HOST_PORT:-18080}"

log() { printf "\n==> %s\n" "$*"; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

command -v curl >/dev/null 2>&1 || die "curl is required."
command -v docker >/dev/null 2>&1 || die "Docker is required."
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is required."
command -v node >/dev/null 2>&1 || die "Node.js/npm is required."

mkdir -p "$RUNTIME_DIR"

if [ ! -f "$SUPABASE_DIR/.env" ]; then
  log "Installing the official self-hosted Supabase configuration and generating secrets."
  rm -rf "$SUPABASE_DIR"
  mkdir -p "$SUPABASE_DIR"
  cd "$RUNTIME_DIR"
  curl -fsSL https://supabase.link/setup.sh -o setup-supabase.sh
  sh setup-supabase.sh --yes --project-dir supabase
  rm -f setup-supabase.sh
fi

cd "$SUPABASE_DIR"

set_env() {
  key="$1"
  value="$2"
  if grep -q "^$key=" .env; then
    sed -i "s|^$key=.*$|$key=$value|" .env
  else
    printf "%s=%s\n" "$key" "$value" >> .env
  fi
}

log "Configuring Supabase for LearnInclusive."
set_env SUPABASE_PUBLIC_URL "https://$SUPABASE_DOMAIN"
set_env API_EXTERNAL_URL "https://$SUPABASE_DOMAIN/auth/v1"
set_env SITE_URL "https://$APP_DOMAIN"
set_env PROXY_DOMAIN "$SUPABASE_DOMAIN"
set_env CERTBOT_EMAIL "admin@$SUPABASE_DOMAIN"
set_env API_GW_HTTP_PORT "127.0.0.1:8000"

log "Installing LearnInclusive Edge Functions."
mkdir -p volumes/functions
for fn in "$ROOT_DIR"/supabase/functions/*; do
  [ -d "$fn" ] || continue
  name="$(basename "$fn")"
  rm -rf "volumes/functions/$name"
  cp -R "$fn" "volumes/functions/$name"
done

: > .env.functions
for key in OPENAI_API_KEY ELEVENLABS_API_KEY RESEND_API_KEY; do
  eval "value=\$$key"
  if [ -n "$value" ]; then
    printf "%s=%s\n" "$key" "$value" >> .env.functions
  fi
done
printf "APP_URL=%s\n" "https://$APP_DOMAIN" >> .env.functions
chmod 600 .env.functions

if ! grep -q "^[[:space:]]*-[[:space:]]*\.env\.functions" docker-compose.yml; then
  python3 - <<'PY'
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()
needle = "  functions:\n"
if needle not in s:
    raise SystemExit("Could not find the official functions service")
s = s.replace(needle, needle + "    env_file:\n      - .env.functions\n", 1)
p.write_text(s)
PY
fi

log "Starting the complete Supabase stack."
sh run.sh start

log "Applying LearnInclusive database migrations."
POSTGRES_PASSWORD="$(grep "^POSTGRES_PASSWORD=" .env | cut -d= -f2-)"
[ -n "$POSTGRES_PASSWORD" ] || die "POSTGRES_PASSWORD was not generated."

DB_PASSWORD_ESCAPED="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$POSTGRES_PASSWORD")"
SUPABASE_NETWORK="$(docker inspect supabase-db --format '{{range $name, $network := .NetworkSettings.Networks}}{{$name}}{{end}}' 2>/dev/null || true)"
[ -n "$SUPABASE_NETWORK" ] || die "Could not determine the Supabase Docker network."

cd "$ROOT_DIR"
npx --yes supabase@2.117.0 db push --db-url "postgresql://postgres:$DB_PASSWORD_ESCAPED@supabase-db:5432/postgres" --yes

cd "$SUPABASE_DIR"
sh run.sh recreate functions

log "Building and starting LearnInclusive."
cd "$ROOT_DIR"
docker compose --env-file "$APP_ENV" up -d --build

log "Running production/local smoke tests."
curl -fsS "http://127.0.0.1:$APP_PORT/" >/dev/null

printf "\nBootstrap complete.\n"
printf "LearnInclusive: https://%s\n" "$APP_DOMAIN"
printf "Supabase:      https://%s\n" "$SUPABASE_DOMAIN"
printf "Runtime:       %s\n" "$SUPABASE_DIR"
