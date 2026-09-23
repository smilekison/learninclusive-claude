#!/bin/sh
set -eu

# Production deployments normally arrive with runtime-config.js baked by the
# repository bootstrap before docker build. Local Docker runs can still supply
# the same public values at container start.
if [ -n "${VITE_SUPABASE_URL:-}" ] && [ -n "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  envsubst '\$VITE_SUPABASE_URL \$VITE_SUPABASE_PUBLISHABLE_KEY' \
    < /runtime-config.js.template \
    > /usr/share/nginx/html/runtime-config.js
elif [ ! -s /usr/share/nginx/html/runtime-config.js ]; then
  echo "ERROR: LearnInclusive runtime configuration is unavailable." >&2
  echo "Run the repository bootstrap for production or provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for a local Docker run." >&2
  exit 1
fi

exec "$@"