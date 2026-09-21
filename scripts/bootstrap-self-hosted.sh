#!/bin/sh
set -eu

# One-command Linux bootstrap for LearnInclusive + the official self-hosted
# Supabase Docker distribution. The vendor Supabase Docker files are fetched
# at install time so this repository does not fork hundreds of upstream files.
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
SUPABASE_DIR="$RUNTIME_DIR/supabase"
APP_ENV="$ROOT_DIR/.env"
APP_DOMAIN="${APP_DOMAIN:-learn.smilekisan.com}"
SUPABASE_DOMAIN="${SUPABASE_DOMAIN:-supabase.smilekisan.com}"
APP_PORT="${LEARNINCLUSIVE_HOST_PORT:-18080}"

log() { printf "\n==> %s\n" "$*"; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "Run as root or with sudo -E."
command -v curl >/dev/null 2>&1 || die "curl is required."

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker."
  apt-get update
  apt-get install -y ca-certificates curl git openssl jq python3
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is required."
command -v node >/dev/null 2>&1 || { apt-get update && apt-get install -y nodejs npm; }
mkdir -p "$RUNTIME_DIR"

if [ ! -f "$SUPABASE_DIR/.env" ]; then
  log "Installing the official self-hosted Supabase configuration and generating secrets."
  rm -rf "$SUPABASE_DIR"
  mkdir -p "$SUPABASE_DIR"
  cd "$RUNTIME_DIR"
  curl -fsSL https://supabase.link/setup.sh -o setup-supabase.sh
  sh setup-supabase.sh --yes --project-dir supabase
  rm -f setup-supabase.sh
fi

cd "$SUPABASE_DIR"

set_env() {
  key="$1"; value="$2"
  if grep -q "^$key=" .env; then
    sed -i "s|^$key=.*$|$key=$value|" .env
  else
    printf "%s=%s\n" "$key" "$value" >> .env
  fi
}

log "Configuring Supabase for the LearnInclusive production domains."
set_env SUPABASE_PUBLIC_URL "https://$SUPABASE_DOMAIN"
set_env API_EXTERNAL_URL "https://$SUPABASE_DOMAIN/auth/v1"
set_env SITE_URL "https://$APP_DOMAIN"
set_env PROXY_DOMAIN "$SUPABASE_DOMAIN"
set_env CERTBOT_EMAIL "admin@$SUPABASE_DOMAIN"
# Keep the gateway private; host Nginx is the public TLS reverse proxy.
set_env API_GW_HTTP_PORT "127.0.0.1:8000"
# The application already performs per-function authorization. The upstream
# self-hosted runtime currently exposes one global verify flag, so keep the
# gateway from rejecting the intentionally public contact/chat/tts functions.
set_env FUNCTIONS_VERIFY_JWT "false"

log "Installing LearnInclusive Edge Functions into the self-hosted Supabase volume."
mkdir -p volumes/functions
if [ -d volumes/functions/hello ]; then rm -rf volumes/functions/hello; fi
for fn in "$ROOT_DIR"/supabase/functions/*; do
  [ -d "$fn" ] || continue
  name="$(basename "$fn")"
  rm -rf "volumes/functions/$name"
  cp -R "$fn" "volumes/functions/$name"
done

: > .env.functions
value="${OPENAI_API_KEY-}"
[ -n "$value" ] && printf "OPENAI_API_KEY=%s\n" "$value" >> .env.functions
value="${ELEVENLABS_API_KEY-}"
[ -n "$value" ] && printf "ELEVENLABS_API_KEY=%s\n" "$value" >> .env.functions
value="${RESEND_API_KEY-}"
[ -n "$value" ] && printf "RESEND_API_KEY=%s\n" "$value" >> .env.functions
chmod 600 .env.functions

# Add application secrets to the official functions service without replacing
# the rest of Supabase upstream configuration.
if ! grep -q "^[[:space:]]*-[[:space:]]*\.env\.functions" docker-compose.yml; then
  python3 - <<'PY'
from pathlib import Path
p = Path("docker-compose.yml")
s = p.read_text()
needle = "  functions:\n"
if needle not in s:
    raise SystemExit("Could not find the official functions service")
s = s.replace(needle, needle + "    env_file:\n      - .env.functions\n", 1)
p.write_text(s)
PY
fi

log "Starting the complete Supabase stack."
sh run.sh start

log "Applying LearnInclusive database migrations."
POSTGRES_PASSWORD="$(grep "^POSTGRES_PASSWORD=" .env | cut -d= -f2-)"
[ -n "$POSTGRES_PASSWORD" ] || die "POSTGRES_PASSWORD was not generated."
DB_PASSWORD_ESCAPED="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$POSTGRES_PASSWORD")"
SUPABASE_NETWORK="$(docker inspect supabase-db --format "{{range \$name, \$network := .NetworkSettings.Networks}}\$name{{end}}" 2>/dev/null || true)"
[ -n "$SUPABASE_NETWORK" ] || SUPABASE_NETWORK="supabase_default"
cd "$ROOT_DIR"
npx --yes supabase@2.117.0 --network-id "$SUPABASE_NETWORK" --workdir "$ROOT_DIR" db push --db-url "postgresql://postgres:$DB_PASSWORD_ESCAPED@supabase-db:5432/postgres" --yes

cd "$SUPABASE_DIR"
log "Restarting Edge Functions after application code is installed."
sh run.sh recreate functions

log "Installing host Nginx reverse proxy."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
cat > "/etc/nginx/sites-available/$SUPABASE_DOMAIN.conf" <<EOF
server {
    listen 80;
    server_name $SUPABASE_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600;
    }
}
EOF
ln -sf "/etc/nginx/sites-available/$SUPABASE_DOMAIN.conf" "/etc/nginx/sites-enabled/$SUPABASE_DOMAIN.conf"
nginx -t
systemctl reload nginx

# If LearnInclusive is already managed by another reverse proxy (for example
# AutoDeploy), leave that routing untouched. On a fresh server, create it here.
if ! grep -Rqs "server_name $APP_DOMAIN;" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null; then
  cat > "/etc/nginx/sites-available/$APP_DOMAIN.conf" <<EOF
server {
    listen 80;
    server_name $APP_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  ln -sf "/etc/nginx/sites-available/$APP_DOMAIN.conf" "/etc/nginx/sites-enabled/$APP_DOMAIN.conf"
fi
nginx -t
systemctl reload nginx

if ! certbot certificates 2>/dev/null | grep -q "Certificate Name: $SUPABASE_DOMAIN"; then
  log "Requesting the HTTPS certificate for Supabase."
  certbot --nginx --non-interactive --agree-tos --email "admin@$SUPABASE_DOMAIN" -d "$SUPABASE_DOMAIN" --redirect
fi

if ! certbot certificates 2>/dev/null | grep -q "Certificate Name: $APP_DOMAIN"; then
  if grep -Rqs "server_name $APP_DOMAIN;" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null; then
    log "Requesting the HTTPS certificate for LearnInclusive."
    certbot --nginx --non-interactive --agree-tos --email "admin@$APP_DOMAIN" -d "$APP_DOMAIN" --redirect
  fi
fi

cd "$ROOT_DIR"
log "Reading generated Supabase public credentials."
SUPABASE_PUBLIC_URL="$(grep "^SUPABASE_PUBLIC_URL=" "$SUPABASE_DIR/.env" | cut -d= -f2-)"
SUPABASE_PUBLISHABLE_KEY="$(grep "^SUPABASE_PUBLISHABLE_KEY=" "$SUPABASE_DIR/.env" | cut -d= -f2-)"
[ -n "$SUPABASE_PUBLIC_URL" ] || die "Missing SUPABASE_PUBLIC_URL."
[ -n "$SUPABASE_PUBLISHABLE_KEY" ] || die "Missing SUPABASE_PUBLISHABLE_KEY."
cat > "$APP_ENV" <<EOF
APP_DOMAIN=$APP_DOMAIN
SUPABASE_DOMAIN=$SUPABASE_DOMAIN
LEARNINCLUSIVE_HOST_PORT=$APP_PORT
VITE_SUPABASE_URL=$SUPABASE_PUBLIC_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
EOF
chmod 600 "$APP_ENV"

log "Building and starting LearnInclusive."
docker compose --env-file "$APP_ENV" up -d --build

log "Running production smoke tests."
curl -fsS "http://127.0.0.1:$APP_PORT/" >/dev/null
curl -fsS "https://$SUPABASE_DOMAIN/auth/v1/" >/dev/null 2>&1 || true

printf "\nBootstrap complete.\n"
printf "LearnInclusive: https://%s\n" "$APP_DOMAIN"
printf "Supabase:      https://%s\n" "$SUPABASE_DOMAIN"
printf "Runtime:       %s\n" "$SUPABASE_DIR"
