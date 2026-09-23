#!/bin/sh
set -eu

# Generic repository bootstrap for LearnInclusive.
# Supabase is fetched as its official Docker distribution and runs entirely
# as Docker containers; it is not installed into the host OS.

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

export SUPABASE_PUBLIC_URL="${SUPABASE_PUBLIC_URL:-https://supabase.smilekisan.com}"
export SITE_URL="${SITE_URL:-https://learn.smilekisan.com}"
export API_EXTERNAL_URL="${API_EXTERNAL_URL:-$SUPABASE_PUBLIC_URL}"
export PROXY_DOMAIN="${PROXY_DOMAIN:-supabase.smilekisan.com}"
export LEARNINCLUSIVE_HOST_PORT="${LEARNINCLUSIVE_HOST_PORT:-18080}"

echo "== LearnInclusive repository bootstrap =="
echo "Application URL: $SITE_URL"
echo "Supabase URL:    $SUPABASE_PUBLIC_URL"

sh ./scripts/setup-supabase.sh

SUPABASE_DIR="$ROOT_DIR/.runtime/supabase"
SUPABASE_ENV="$SUPABASE_DIR/.env"
[ -s "$SUPABASE_ENV" ] || { echo "ERROR: Supabase .env was not generated." >&2; exit 1; }

PUBLISHABLE_KEY="$(awk -F= '$1=="SUPABASE_PUBLISHABLE_KEY"{print substr($0,index($0,"=")+1)}' "$SUPABASE_ENV")"
[ -n "$PUBLISHABLE_KEY" ] || { echo "ERROR: SUPABASE_PUBLISHABLE_KEY was not generated." >&2; exit 1; }

# Vite substitutes VITE_* values at build time, so create this ignored file
# before AutoDeploy runs docker build.
cat > "$ROOT_DIR/.env.production" <<EOF
VITE_SUPABASE_URL=$SUPABASE_PUBLIC_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
EOF
chmod 600 "$ROOT_DIR/.env.production"

# Install LearnInclusive Edge Functions into the official self-hosted runtime.
if [ -d "$ROOT_DIR/supabase/functions" ]; then
  mkdir -p "$SUPABASE_DIR/volumes/functions"
  for fn in "$ROOT_DIR"/supabase/functions/*; do
    [ -d "$fn" ] || continue
    name="$(basename "$fn")"
    rm -rf "$SUPABASE_DIR/volumes/functions/$name"
    cp -R "$fn" "$SUPABASE_DIR/volumes/functions/$name"
  done

  : > "$SUPABASE_DIR/.env.functions"
  for key in OPENAI_API_KEY ELEVENLABS_API_KEY RESEND_API_KEY; do
    eval "value=${$key:-}"
    if [ -n "$value" ]; then
      printf '%s=%s\n' "$key" "$value" >> "$SUPABASE_DIR/.env.functions"
    fi
  done
  printf 'APP_URL=%s\n' "$SITE_URL" >> "$SUPABASE_DIR/.env.functions"
  chmod 600 "$SUPABASE_DIR/.env.functions"

  if ! grep -q "^[[:space:]]*-[[:space:]]*\.env\.functions" "$SUPABASE_DIR/docker-compose.yml"; then
    python3 - <<'PY'
from pathlib import Path
p = Path(".runtime/supabase/docker-compose.yml")
s = p.read_text()
needle = "  functions:\n"
if needle not in s:
    raise SystemExit("Could not find the official functions service")
s = s.replace(needle, needle + "    env_file:\n      - .env.functions\n", 1)
p.write_text(s)
PY
  fi
  cd "$SUPABASE_DIR"
  sh run.sh recreate functions
  cd "$ROOT_DIR"
fi

# Apply repository migrations using a transient Supabase CLI process.
# Supabase CLI is not installed into the host system.
POSTGRES_PASSWORD="$(awk -F= '$1=="POSTGRES_PASSWORD"{print substr($0,index($0,"=")+1)}' "$SUPABASE_ENV")"
[ -n "$POSTGRES_PASSWORD" ] || { echo "ERROR: POSTGRES_PASSWORD was not generated." >&2; exit 1; }

DB_PASSWORD_ESCAPED="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$POSTGRES_PASSWORD")"
SUPABASE_NETWORK="$(docker inspect supabase-db --format '{{range $name, $network := .NetworkSettings.Networks}}{{$name}}{{end}}' 2>/dev/null || true)"
[ -n "$SUPABASE_NETWORK" ] || { echo "ERROR: Could not determine Supabase Docker network." >&2; exit 1; }

if [ -d "$ROOT_DIR/supabase/migrations" ]; then
  npx --yes supabase@latest db push --db-url "postgresql://postgres:$DB_PASSWORD_ESCAPED@supabase-db:5432/postgres?sslmode=disable" --yes
fi

mkdir -p "$ROOT_DIR/.runtime"
cat > "$ROOT_DIR/.runtime/deployment.env" <<EOF
VITE_SUPABASE_URL=$SUPABASE_PUBLIC_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
EOF
chmod 600 "$ROOT_DIR/.runtime/deployment.env"

echo "Repository bootstrap complete. Generated Supabase configuration is ready for the application build."
