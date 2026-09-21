#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

"$ROOT_DIR/scripts/setup-supabase.sh"

cd "$ROOT_DIR"
docker compose --env-file .runtime/learninclusive.env up -d --build

echo ""
echo "LearnInclusive: http://localhost:18080"
echo "Supabase:       http://localhost:8000"
