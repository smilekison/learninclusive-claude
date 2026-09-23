# Deployment

LearnInclusive is a self-contained application repository. It does not require a specific deployment platform.

## Local development with Docker Desktop

The recommended local workflow uses the Supabase CLI as a repository dependency. The CLI runs the complete local Supabase stack in Docker, so Supabase is not installed directly into Windows or Linux.

### Windows 11

1. Install Docker Desktop with WSL2 enabled.
2. Install Node.js LTS.
3. Clone this repository.
4. Open PowerShell in the repository root.
5. Run:

```powershell
.\scripts\start-local.ps1
```

The script runs Supabase through Docker Desktop, applies the repository's migrations/seed configuration, builds the LearnInclusive image, and starts it.

### Linux

Install Docker Engine/Compose v2 and Node.js LTS, then run:

```bash
./scripts/start-local.sh
```

The same repository-owned workflow is used; Supabase runs in Docker.

### Local URLs

- LearnInclusive: http://localhost:18080
- Supabase API: http://127.0.0.1:54321
- Supabase Studio: http://127.0.0.1:54323

To stop the local Supabase stack:

```bash
npx supabase stop
```

The same command works from PowerShell.

## Production / self-hosted server

For a Linux server, the repository also contains `scripts/setup-supabase.sh`. It downloads the official self-hosted Supabase Docker distribution into the ignored `.runtime/` directory and starts the multi-container Supabase runtime.

```bash
./scripts/setup-supabase.sh
docker compose --env-file .runtime/learninclusive.env up -d --build
```

The root `Dockerfile` builds only the LearnInclusive web application. Supabase is intentionally a separate Docker workload because self-hosted Supabase is a multi-container system.

## Deployment-platform independence

A deployment platform can clone this repository and execute its standard Docker/Compose workflow. It does not need a LearnInclusive-specific plugin or Supabase integration.

The application repository owns:

- Supabase configuration
- database migrations
- Edge Functions
- application Docker image
- local Docker workflow
- self-hosted Supabase bootstrap

The deployment platform owns only generic deployment concerns such as cloning, building, starting containers, networking, secrets injection, and health checks.

There is no application dependency on a particular deployment platform.

## Configuration

The browser application uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put server-only Supabase credentials or Edge Function secrets in `VITE_*` variables.
