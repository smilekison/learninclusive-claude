#!/bin/sh
set -eu

APP_URL="${APP_URL:-https://learn.smilekisan.com}"
DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"
FUNCTIONS_CONTAINER="${SUPABASE_FUNCTIONS_CONTAINER:-supabase-edge-functions}"
SUPABASE_NETWORK="${SUPABASE_DOCKER_NETWORK:-}"

: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD must be configured in the AutoDeploy deploy target environment}"
: "${SUPABASE_SELF_HOSTED:?SUPABASE_SELF_HOSTED must be set to true for self-hosted Supabase}"

cd /app

printf '%s\n' '==> Verifying Docker access to the self-hosted Supabase stack'
docker info >/dev/null
docker inspect "$DB_CONTAINER" >/dev/null
docker inspect "$FUNCTIONS_CONTAINER" >/dev/null

if [ -z "$SUPABASE_NETWORK" ]; then
  SUPABASE_NETWORK="$(docker inspect "$DB_CONTAINER" --format '{{range $name, $network := .NetworkSettings.Networks}}{{println $name}}{{end}}' | head -n 1)"
fi

: "${SUPABASE_NETWORK:?Could not determine the Supabase Docker network}"
MIGRATION_CONTAINER="$(hostname)"

printf '%s\n' "==> Connecting deployment container to Supabase network: $SUPABASE_NETWORK"
if ! docker network inspect "$SUPABASE_NETWORK" --format '{{json .Containers}}' | grep -q ""$MIGRATION_CONTAINER""; then
  docker network connect "$SUPABASE_NETWORK" "$MIGRATION_CONTAINER"
fi

DB_PASSWORD_ENCODED="$(node -p 'encodeURIComponent(process.argv[1])' "$SUPABASE_DB_PASSWORD")"
DB_URL="postgresql://postgres:$DB_PASSWORD_ENCODED@$DB_CONTAINER:5432/postgres"

printf '%s\n' '==> Showing self-hosted migration status'
supabase migration list --db-url "$DB_URL"

printf '%s\n' '==> Previewing database migrations'
supabase db push --db-url "$DB_URL" --dry-run

printf '%s\n' '==> Applying database migrations'
supabase db push --db-url "$DB_URL"

printf '%s\n' '==> Copying Edge Functions into the self-hosted functions volume'
docker cp /app/supabase/functions/. "$FUNCTIONS_CONTAINER:/home/deno/functions/"

printf '%s\n' '==> Restarting self-hosted Edge Functions'
docker restart "$FUNCTIONS_CONTAINER" >/dev/null

printf '%s\n' '==> Waiting for Edge Functions runtime'
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker inspect --format '{{.State.Running}}' "$FUNCTIONS_CONTAINER" 2>/dev/null | grep -q true; then
    break
  fi
  sleep 2
done

if ! docker inspect --format '{{.State.Running}}' "$FUNCTIONS_CONTAINER" 2>/dev/null | grep -q true; then
  printf '%s\n' 'Self-hosted Edge Functions container did not remain running' >&2
  exit 1
fi

printf '%s\n' '==> Self-hosted Supabase deployment gate passed'
