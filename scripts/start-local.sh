#!/bin/sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
"$ROOT_DIR/scripts/setup-supabase.sh"
cd "$ROOT_DIR"
docker compose --env-file .runtime/learninclusive.env up -d --build
printf "\nLearnInclusive: http://localhost:18080\nSupabase:       http://localhost:8000\n"
