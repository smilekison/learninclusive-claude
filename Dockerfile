# LearnInclusive production image
# Stage 1: build the Vite React application.
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY} \
    VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}

RUN npm run build

# Stage 2: production runtime.
# AutoDeploy runs the migration/function deployment gate inside the freshly
# built image before swapping traffic. Keep the Supabase CLI here so that
# database migrations and Edge Functions are deployed from the exact commit
# being released rather than from a separate manual process.
FROM node:20-alpine AS runtime

RUN apk add --no-cache nginx docker-cli \
    && npm install --global supabase@2.117.0 \
    && npm cache clean --force \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/supabase /app/supabase
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY scripts/autodeploy-migrate.sh /usr/local/bin/autodeploy-migrate

RUN chmod 0755 /usr/local/bin/autodeploy-migrate \
    && mkdir -p /run/nginx \
    && nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
