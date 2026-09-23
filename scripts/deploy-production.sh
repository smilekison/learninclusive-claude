#!/bin/sh
set -eu

# LearnInclusive production bootstrap.
# This repository owns the Supabase runtime and derives the browser publishable
# key from the repository-owned Supabase .env. No deployment-platform integration
# is required.

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

SUPABASE_PUBLIC_URL="${SUPABASE_PUBLIC_URL:-https://supabase.smilekisan.com}"
SITE_URL="${SITE_URL:-https://learn.smilekisan.com}"
API_EXTERNAL_URL="${API_EXTERNAL_URL:-$SUPABASE_PUBLIC_URL}"
PROXY_DOMAIN="${PROXY_DOMAIN:-supabase.smilekisan.com}"
LEARNINCLUSIVE_HOST_PORT="${LEARNINCLUSIVE_HOST_PORT:-18080}"

export SUPABASE_PUBLIC_URL SITE_URL API_EXTERNAL_URL PROXY_DOMAIN LEARNINCLUSIVE_HOST_PORT

echo "== LearnInclusive production deployment =="
echo "Application URL: $SITE_URL"
echo "Supabase URL:    $SUPABASE_PUBLIC_URL"

./scripts/setup-supabase.sh

ENV_FILE="$ROOT_DIR/.runtime/learninclusive.env"
if [ ! -s "$ENV_FILE" ]; then
  echo "ERROR: Supabase bootstrap did not create $ENV_FILE" >&2
  exit 1
fi

# Do not print the publishable key. It is intentionally passed only to the
# application container through the generated runtime environment file.
if ! grep -q '^VITE_SUPABASE_URL=' "$ENV_FILE"; then
  echo "ERROR: VITE_SUPABASE_URL was not generated." >&2
  exit 1
fi
if ! grep -q '^VITE_SUPABASE_PUBLISHABLE_KEY=' "$ENV_FILE"; then
  echo "ERROR: VITE_SUPABASE_PUBLISHABLE_KEY was not generated." >&2
  exit 1
fi

echo "Starting LearnInclusive with the generated Supabase configuration..."
docker compose --env-file "$ENV_FILE" up -d --build

echo ""
echo "Deployment complete."
echo "Application: $SITE_URL"
echo "Supabase:    $SUPABASE_PUBLIC_URL"
echo ""
echo "The publishable key was generated/read from the repository-owned"
echo "Supabase environment and written to .runtime/learninclusive.env."
