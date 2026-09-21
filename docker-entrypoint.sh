#!/bin/sh
set -eu

: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL is required}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?VITE_SUPABASE_PUBLISHABLE_KEY is required}"

envsubst '\$VITE_SUPABASE_URL \$VITE_SUPABASE_PUBLISHABLE_KEY'   < /runtime-config.js.template   > /usr/share/nginx/html/runtime-config.js

exec "$@"
