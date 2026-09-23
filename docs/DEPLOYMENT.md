# Deployment

LearnInclusive is a self-contained application repository. It does not require a specific deployment platform and contains no configuration for any external deployment engine.

## Runtime architecture

- The root `Dockerfile` builds the LearnInclusive web application.
- `scripts/setup-supabase.sh` provisions the repository's self-hosted Supabase runtime using the official Supabase Docker distribution.
- `supabase/` contains this application's migrations and Edge Functions.

Supabase is an application infrastructure dependency. A deployment system only needs a machine capable of running Docker and Docker Compose and executing the repository's deployment workflow. The deployment system must not contain LearnInclusive-specific Supabase configuration.

## Production deployment

Clone the repository, provide Docker Engine and Docker Compose v2, configure the public URLs, then run:

```bash
./scripts/setup-supabase.sh
docker compose --env-file .runtime/learninclusive.env up -d --build
```

For a production installation, set the deployment-specific values before the Supabase setup:

```bash
SUPABASE_PUBLIC_URL=https://supabase.example.com \
API_EXTERNAL_URL=https://supabase.example.com \
SITE_URL=https://learninclusive.example.com \
PROXY_DOMAIN=supabase.example.com \
./scripts/setup-supabase.sh
```

The deployment platform is intentionally not named here. GitHub Actions, GitLab CI/CD, a generic deployment service, or a manual Docker deployment can execute the same repository-owned workflow.

## Supabase

Supabase is not installed on the host and is not a deployment-platform plugin. The repository downloads the official self-hosted Supabase Docker distribution into the ignored `.runtime/` directory and starts it with Docker Compose. Application-specific migrations and Edge Functions remain in this repository.

The root application image does not contain the complete Supabase server stack because self-hosted Supabase is a multi-container runtime. Docker Compose is therefore the repository-owned deployment boundary for the application and its Supabase dependency.

## Required application configuration

The browser application uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put server-only Supabase credentials or Edge Function secrets in `VITE_*` variables.

## Independence contract

This repository must remain deployable without knowing the name, API, configuration schema, or installation state of the deployment platform.

A deployment platform should treat this repository as a generic application workload and execute its standard Docker/Compose workflow. It must not require LearnInclusive-specific integrations or contain LearnInclusive-specific logic.
