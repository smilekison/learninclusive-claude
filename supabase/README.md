# Self-hosted Supabase

LearnInclusive uses Supabase for authentication, PostgreSQL, Storage, Realtime and the
other Supabase services used by the application.

The repository deliberately does **not** vendor Supabase's large Docker configuration.
Instead, `scripts/setup-supabase.sh` installs the official Supabase self-hosted Docker
distribution into `.runtime/supabase/`. Runtime state and secrets are ignored by Git.

## Install and start

From the repository root on a machine with Docker Compose v2:

```bash
./scripts/setup-supabase.sh
docker compose --env-file .runtime/learninclusive.env up -d --build
```

On Windows/PowerShell, run the script from WSL/Git Bash, or execute the equivalent
commands from a Linux environment.

By default:

- Supabase API/Studio: `http://localhost:8000`
- LearnInclusive: `http://localhost:18080`
- Supabase configuration/secrets: `.runtime/supabase/`
- LearnInclusive runtime environment: `.runtime/learninclusive.env`

The official self-hosted Supabase distribution is a multi-container stack, not a
single database container. It includes the API gateway, Auth, PostgREST, Realtime,
Storage, Studio, Postgres, Supavisor and supporting services.

## Production

Set the URLs before running the bootstrap:

```bash
SUPABASE_PUBLIC_URL=https://supabase.example.com \
API_EXTERNAL_URL=https://supabase.example.com \
SITE_URL=https://learninclusive.example.com \
PROXY_DOMAIN=supabase.example.com \
./scripts/setup-supabase.sh
```

Put HTTPS/TLS in front of the Supabase gateway using the server's reverse proxy.
Do not expose the raw development port directly to the Internet.

## Updating Supabase

The installer pins the official `self-hosted/v0.8.1` release by default. To update,
set `SUPABASE_REF` to the desired official self-hosted release and rerun the script
after backing up the database and reviewing the Supabase release notes.

## Reset

**Warning: this destroys the Supabase database and storage data.**

```bash
cd .runtime/supabase
sh reset.sh
```

See the official Supabase Docker self-hosting documentation for the release-specific
configuration and upgrade process.
