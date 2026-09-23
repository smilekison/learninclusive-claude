# AutoDeploy production deployment

LearnInclusive is deployed by the existing AutoDeploy SERVICE target.

## Important deployment rule

This repository does **not** use an AutoDeploy `supabase` integration.

The deployment engine builds/runs the LearnInclusive application. Supabase must be handled as Docker workloads owned by this repository, not by an AutoDeploy integration and not by another repository.

The empty `autodeploy.integrations.json` file is intentional. It prevents AutoDeploy from trying to load an unsupported integration named `supabase`.

## Why the original deployment failed

The deployment log reached repository checkout and then failed with:

```text
AutoDeploy integration "supabase" is not installed on this deployment engine
```

This occurs during AutoDeploy integration discovery, before the application Docker build. Adding the Supabase CLI/package to the frontend image cannot fix that particular discovery error.

## Supabase architecture

LearnInclusive uses Supabase for PostgreSQL, Auth, Storage, Realtime and Edge Functions.

Supabase's official self-hosted deployment is a Docker Compose multi-container stack, not a single database image. citeturn823591search0turn823591search1

Repository-specific Supabase assets are already present under `supabase/`, including migrations and Edge Functions.

## Repository-only rule

All LearnInclusive-specific Supabase deployment logic must live in this repository.

Do not:

- add a `supabase` AutoDeploy integration
- install Supabase directly on the host
- require `auto-deploy-project` to install or provision Supabase
- give the LearnInclusive frontend container access to the Docker socket

## Runtime configuration

The frontend requires:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Server-side credentials and Edge Function secrets must not be exposed through `VITE_*` variables.

## Docker

The root `Dockerfile` builds the LearnInclusive frontend and serves it with nginx.
The root `docker-compose.yml` is the application Compose definition.
The `supabase/` directory contains the project's migrations, configuration and Edge Functions.

Supabase documents Docker Compose as the recommended self-hosting mechanism and documents the API gateway, Auth, REST, Storage, Realtime and Edge Functions as separate services in the self-hosted stack. citeturn823591search1

## Verification

After the repository is deployed, verify that:

1. AutoDeploy passes integration discovery.
2. The LearnInclusive Docker image builds successfully.
3. `VITE_SUPABASE_URL` points to the intended Supabase gateway.
4. Authentication works.
5. Database/REST operations work.
6. Storage operations work.
7. Edge Functions under `/functions/v1/*` work.
8. Realtime works.
9. All migrations under `supabase/migrations` are applied.
10. No server-side Supabase secret is exposed in the browser bundle.

Removing the unsupported AutoDeploy integration fixes the reported error, but the Supabase containers still need to be started by the repository-owned Docker deployment workflow.
