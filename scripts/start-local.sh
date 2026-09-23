#!/bin/sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "ERROR: npx is required."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker Desktop/Engine is required."; exit 1; }

echo "Starting the repository Supabase project with Docker..."
npx --yes supabase@latest start

STATUS="$(npx --yes supabase@latest status -o env)"
API_URL="$(printf '%s\n' "$STATUS" | awk -F= '$1=="API_URL"{print substr($0,index($0,"=")+1)}')"
ANON_KEY="$(printf '%s\n' "$STATUS" | awk -F= '$1=="ANON_KEY"{print substr($0,index($0,"=")+1)}')"

[ -n "$API_URL" ] || { echo "ERROR: Supabase API_URL was not returned."; exit 1; }
[ -n "$ANON_KEY" ] || { echo "ERROR: Supabase ANON_KEY was not returned."; exit 1; }

cat > .runtime-learninclusive.env <<EOF
VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
LEARNINCLUSIVE_HOST_PORT=18080
EOF

docker compose --env-file .runtime-learninclusive.env up -d --build
rm -f .runtime-learninclusive.env

printf "\nLearnInclusive: http://localhost:18080\nSupabase API:  %s\nSupabase Studio: http://127.0.0.1:54323\n" "$API_URL"
