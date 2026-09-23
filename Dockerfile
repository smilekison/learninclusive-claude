# syntax=docker/dockerfile:1

# LearnInclusive production image.
# Supabase is consumed as repository-owned Docker services; no AutoDeploy
# integration or host-level Supabase installation is required.

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Bake public runtime configuration when the repository bootstrap has generated
.env.production. This keeps deployment configuration inside LearnInclusive.
RUN if [ -f .env.production ]; then \
      SUPABASE_URL="$(awk -F= '$1=="VITE_SUPABASE_URL"{print substr($0,index($0,"=")+1)}' .env.production)"; \
      SUPABASE_KEY="$(awk -F= '$1=="VITE_SUPABASE_PUBLISHABLE_KEY"{print substr($0,index($0,"=")+1)}' .env.production)"; \
      [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ] || { echo "ERROR: .env.production is missing required LearnInclusive runtime configuration." >&2; exit 1; }; \
      printf '%s\n' \
        'window.__LEARNINCLUSIVE_CONFIG__ = {' \
        "  supabaseUrl: \"$SUPABASE_URL\"," \
        "  supabasePublishableKey: \"$SUPABASE_KEY\"" \
        '};' > /app/dist/runtime-config.js; \
    fi

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY runtime-config.js.template /runtime-config.js.template
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod 0755 /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]