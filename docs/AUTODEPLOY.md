# Production deployment

LearnInclusive can be bootstrapped on a fresh Linux server with the official self-hosted Supabase Docker distribution.

## Fresh server

After cloning this repository:

```bash
sudo -E APP_DOMAIN=learn.smilekisan.com \
  SUPABASE_DOMAIN=supabase.smilekisan.com \
  ./scripts/bootstrap-self-hosted.sh
```

The bootstrap script:

1. Installs Docker/Compose prerequisites if missing.
2. Downloads the official Supabase self-hosted Docker configuration.
3. Generates Supabase secrets and API keys.
4. Configures Supabase for `https://supabase.smilekisan.com`.
5. Configures Auth redirects for `https://learn.smilekisan.com`.
6. Installs this repository's Edge Functions into the Supabase functions volume.
7. Applies `supabase/migrations` to the self-hosted Postgres database.
8. Installs/configures the host Nginx reverse proxy.
9. Requests the HTTPS certificate for the Supabase domain.
10. Builds and starts the LearnInclusive frontend.
11. Uses the generated Supabase publishable key when building the frontend.

Supabase's official Docker setup is used rather than a copied or hand-maintained replacement. The official documentation recommends Docker Compose for self-hosting and generates secure secrets during setup. citeturn0search1

## DNS

Before running the bootstrap, both domains must resolve to the server:

```text
learn.smilekisan.com     A     <server-ip>
supabase.smilekisan.com  A     <server-ip>
```

The Supabase API gateway stays bound to localhost and host Nginx terminates HTTPS. Supabase recommends a reverse proxy with HTTPS for production and requires WebSocket forwarding for Realtime. citeturn4search1

## Optional Edge Function secrets

The bootstrap accepts these environment variables:

```text
OPENAI_API_KEY
ELEVENLABS_API_KEY
RESEND_API_KEY
```

They are written only to the runtime's `.env.functions` file and are never committed to Git.

For example:

```bash
sudo -E OPENAI_API_KEY='...' \
  ELEVENLABS_API_KEY='...' \
  RESEND_API_KEY='...' \
  ./scripts/bootstrap-self-hosted.sh
```

## Local Docker Compose

For a machine where Supabase is already available, the repository also provides:

```bash
cp .env.example .env
# set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
docker compose up -d --build
```

The frontend image contains only the Vite build and Nginx. Supabase is deliberately not embedded inside that application image.

## Runtime layout

```text
Server
├── LearnInclusive
│   └── 127.0.0.1:18080
│
└── Self-hosted Supabase
    ├── PostgreSQL
    ├── Auth
    ├── PostgREST
    ├── Storage
    ├── Realtime
    ├── Edge Functions
    └── Studio
```

The browser talks to:

```text
https://learn.smilekisan.com
        |
        +--> https://supabase.smilekisan.com
```

The frontend no longer contains a fallback to the old Supabase Cloud project. Production builds fail if the self-hosted Supabase URL or publishable key is missing.

## Updating the server

Pull the repository and rerun the bootstrap script:

```bash
git pull
sudo -E ./scripts/bootstrap-self-hosted.sh
```

The Supabase installation lives under `.runtime/supabase`, outside Git. Its database/storage data and secrets therefore survive repository updates.

For upstream Supabase updates, use the generated `update.sh` in the self-hosted Supabase runtime; Supabase documents this as the supported upgrade path. citeturn4search4

## Security

Never commit:

- `.env`
- `.env.functions`
- Supabase generated secrets
- `POSTGRES_PASSWORD`
- `SUPABASE_SECRET_KEY`
- `SERVICE_ROLE_KEY`
- provider API keys

The browser receives only the Supabase publishable key. Supabase documents the publishable key as the client-side credential and the secret key as server-side only. citeturn0search1
