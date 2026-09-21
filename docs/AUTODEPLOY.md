# AutoDeploy production deployment

LearnInclusive is deployed as a single AutoDeploy **SERVICE** target. GitHub is only the source repository; GitHub Actions is not used.

## AutoDeploy target

Configure the target once:

- Repository: `smilekison/learninclusive-claude`
- Branch: `main`
- Target type: `SERVICE`
- Service directory: `.`
- Dockerfile: `Dockerfile`
- Container port: `80` (read from Dockerfile)
- Domain: `learn.smilekisan.com`
- Mark the service as the edge/public service.
- Enable **auto-deploy on push**.
- Enable **auto-rollback** if the target's rollback policy is desired.

### Pre-deploy checks

Enable **Run tests before deploy** and use:

```text
sh scripts/autodeploy-test.sh
```

This runs:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`

The check runs against the freshly cloned commit before the Docker image is built.

### Supabase deployment gate

This deployment uses **self-hosted Supabase on the same Ubuntu server**, not the Supabase Cloud/Management API. There is therefore no `SUPABASE_ACCESS_TOKEN` and no cloud project-ref deployment.

Enable **Run migrations before deploy** and use:

```text
/usr/local/bin/autodeploy-migrate
```

The migration gate runs inside the freshly built image and receives access to the host Docker socket. It:

1. discovers the self-hosted Supabase Postgres and Edge Functions containers;
2. joins the Supabase Docker network;
3. runs `supabase migration list --db-url`;
4. runs `supabase db push --db-url ... --dry-run`;
5. applies only pending migrations with `supabase db push --db-url ...`;
6. copies the committed Edge Functions into the self-hosted functions volume;
7. restarts the self-hosted Edge Functions container.

Supabase documents `db push --db-url` for self-hosted databases, and self-hosted Edge Functions are updated by copying functions into the mounted functions directory and restarting the functions service.

The migration gate deliberately never runs `db reset --linked` and never uses `--include-seed` against production.

### AutoDeploy environment variables

Set these as protected/secret environment variables on the LearnInclusive target:

```text
SUPABASE_SELF_HOSTED=true
SUPABASE_DB_PASSWORD=<the POSTGRES_PASSWORD from your self-hosted Supabase .env>
SUPABASE_DB_CONTAINER=supabase-db
SUPABASE_FUNCTIONS_CONTAINER=supabase-edge-functions
SUPABASE_DOCKER_NETWORK=supabase_default
APP_URL=https://learn.smilekisan.com
```

The database password must be the **actual password already used by your self-hosted Supabase installation**. Do not generate a new random password for AutoDeploy: changing the AutoDeploy value without changing PostgreSQL would make migrations fail. Supabase's self-hosted Docker setup stores `POSTGRES_PASSWORD` in its server-side `.env`.

The public Vite/Supabase values do not need to be secret.

Do **not** put `SUPABASE_SERVICE_ROLE_KEY`, OpenAI keys, ElevenLabs keys, or Resend keys in the frontend environment. Self-hosted Edge Function secrets belong in the Supabase functions service environment. Use a separate `.env.functions` on the Supabase host and do not commit it.

Your self-hosted Supabase functions environment should contain:

```text
APP_URL=https://learn.smilekisan.com
OPENAI_API_KEY=<your OpenAI API key>
ELEVENLABS_API_KEY=<your ElevenLabs API key>
RESEND_API_KEY=<your Resend API key>
```

## Deployment order

AutoDeploy should therefore execute:

```text
GitHub main
   ↓
clone exact commit
   ↓
pre-deploy tests
   ↓
Docker build
   ↓
Supabase migration dry-run
   ↓
Supabase migration apply
   ↓
Edge Function deployment
   ↓
container health check
   ↓
traffic swap
   ↓
HTTPS health check
```

If tests, migration, function deployment, or health checks fail, the old application remains in service because the database/function gate runs before the application swap.

## Database migration policy

All production schema changes must be committed as timestamped files under:

```text
supabase/migrations/
```

Never use `supabase db reset --linked` for production and never use `supabase db push --include-seed` for production.

If AutoDeploy reports a migration-history mismatch, stop and reconcile the remote migration history rather than forcing it. Use `supabase migration list` first and only use `supabase migration repair` when the actual database state is already known to match the intended migration.

## Supabase Auth URL

In the Supabase Dashboard, set the production Site URL to:

```text
https://learn.smilekisan.com
```

and add:

```text
https://learn.smilekisan.com/**
```

to the allowed redirect URLs.

The frontend uses `window.location.origin` for production auth/enrollment links, so no separate frontend URL update is needed for each deployment.
