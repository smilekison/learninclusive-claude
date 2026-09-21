#!/bin/sh
set -eu

PROJECT_REF="${SUPABASE_PROJECT_ID:-ittuorfjrmktmjwwmgad}"
APP_URL="${APP_URL:-https://learn.smilekisan.com}"

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN must be configured in the AutoDeploy deploy target environment}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD must be configured in the AutoDeploy deploy target environment}"

cd /app

printf '%s\n' '==> Verifying Supabase project access'
supabase projects list >/dev/null

printf '%s\n' '==> Linking Supabase project'
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" supabase link   --project-ref "$PROJECT_REF"   --password "$SUPABASE_DB_PASSWORD"

printf '%s\n' '==> Showing migration status'
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" supabase migration list

printf '%s\n' '==> Previewing database migrations'
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" supabase db push   --project-ref "$PROJECT_REF"   --password "$SUPABASE_DB_PASSWORD"   --dry-run

printf '%s\n' '==> Applying database migrations'
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" supabase db push   --project-ref "$PROJECT_REF"   --password "$SUPABASE_DB_PASSWORD"

printf '%s\n' '==> Setting production application URL for Edge Functions'
supabase secrets set   --project-ref "$PROJECT_REF"   "APP_URL=$APP_URL"

printf '%s\n' '==> Deploying all Edge Functions'
supabase functions deploy   --project-ref "$PROJECT_REF"   --use-api

printf '%s\n' '==> Verifying deployed Edge Functions'
supabase functions list --project-ref "$PROJECT_REF"

printf '%s\n' '==> Supabase production deployment gate passed'
