#!/bin/sh
set -eu

# LearnInclusive self-hosted Supabase bootstrap.
# Uses the official Supabase Docker distribution rather than maintaining a
# forked/incomplete compose file in this application repository.

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RUNTIME_DIR="$ROOT_DIR/.runtime/supabase"
SUPABASE_REF="${SUPABASE_REF:-self-hosted/v0.8.1}"
SUPABASE_PUBLIC_URL="${SUPABASE_PUBLIC_URL:-http://localhost:8000}"
SITE_URL="${SITE_URL:-http://localhost:18080}"
API_EXTERNAL_URL="${API_EXTERNAL_URL:-$SUPABASE_PUBLIC_URL}"
PROXY_DOMAIN="${PROXY_DOMAIN:-localhost}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: $1 is required." >&2
    exit 1
  }
}

require_cmd git
require_cmd openssl
require_cmd docker

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose v2 is required." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/.runtime"

if [ ! -f "$RUNTIME_DIR/docker-compose.yml" ]; then
  echo "Installing official Supabase Docker configuration: $SUPABASE_REF"
  rm -rf "$RUNTIME_DIR" "$ROOT_DIR/.runtime/supabase-source"
  git clone --depth 1 --branch "$SUPABASE_REF"     https://github.com/supabase/supabase.git     "$ROOT_DIR/.runtime/supabase-source"
  mkdir -p "$RUNTIME_DIR"
  cp -a "$ROOT_DIR/.runtime/supabase-source/docker/." "$RUNTIME_DIR/"
  rm -rf "$ROOT_DIR/.runtime/supabase-source"
fi

cd "$RUNTIME_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Generate secure JWT/database/dashboard secrets and the keys used by the
# current self-hosted release. Never commit this .env file.
sh utils/generate-keys.sh --update-env
if [ -x utils/add-new-auth-keys.sh ]; then
  sh utils/add-new-auth-keys.sh
fi

set_env() {
  key="$1"
  value="$2"
  if grep -q "^$key=" .env; then
    sed -i.old "s|^$key=.*$|$key=$value|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}

set_env SUPABASE_PUBLIC_URL "$SUPABASE_PUBLIC_URL"
set_env API_EXTERNAL_URL "$API_EXTERNAL_URL"
set_env SITE_URL "$SITE_URL"
set_env PROXY_DOMAIN "$PROXY_DOMAIN"

echo "Pulling Supabase images..."
docker compose pull

echo "Starting Supabase..."
docker compose up -d --wait

PUBLISHABLE_KEY=$(awk -F= '$1=="SUPABASE_PUBLISHABLE_KEY"{print substr($0,index($0,"=")+1)}' .env)
if [ -z "$PUBLISHABLE_KEY" ]; then
  # Older self-hosted releases may only have ANON_KEY. The current frontend
  # accepts the publishable key, so retain compatibility with the official
  # generated legacy key when the new key is unavailable.
  PUBLISHABLE_KEY=$(awk -F= '$1=="ANON_KEY"{print substr($0,index($0,"=")+1)}' .env)
fi

if [ -z "$PUBLISHABLE_KEY" ]; then
  echo "ERROR: Could not find SUPABASE_PUBLISHABLE_KEY or ANON_KEY." >&2
  exit 1
fi

cat > "$ROOT_DIR/.runtime/learninclusive.env" <<EOF
VITE_SUPABASE_URL=$SUPABASE_PUBLIC_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
LEARNINCLUSIVE_HOST_PORT=${LEARNINCLUSIVE_HOST_PORT:-18080}
EOF

echo ""
echo "Supabase is running."
echo "  API / Studio: $SUPABASE_PUBLIC_URL"
echo "  Config:       $RUNTIME_DIR/.env"
echo ""
echo "LearnInclusive runtime env written to:"
echo "  $ROOT_DIR/.runtime/learninclusive.env"
echo ""
echo "Start LearnInclusive with:"
echo "  docker compose --env-file .runtime/learninclusive.env up -d --build"
echo ""
echo "Check Supabase:"
echo "  cd .runtime/supabase && docker compose ps"
