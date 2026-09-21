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

Enable **Run migrations before deploy** and use:

```text
/usr/local/bin/autodeploy-migrate
```

The production image contains the pinned Supabase CLI and the complete `supabase/` directory. The gate:

1. authenticates to the Supabase Management API;
2. links project `ittuorfjrmktmjwwmgad`;
3. prints local/remote migration history;
4. runs `supabase db push --dry-run`;
5. applies only pending migrations with `supabase db push`;
6. sets `APP_URL=https://learn.smilekisan.com`;
7. deploys all Edge Functions with `--use-api`;
8. lists the deployed functions.

The command deliberately never runs `db reset --linked` and never uses `--include-seed` against production.

### AutoDeploy environment variables

Set these as protected/secret environment variables on the LearnInclusive target:

```text
SUPABASE_PROJECT_ID=ittuorfjrmktmjwwmgad
SUPABASE_ACCESS_TOKEN=<Supabase personal access token>
SUPABASE_DB_PASSWORD=<Supabase database password>
```

The public Vite/Supabase values do not need to be secret; the application already contains the Supabase project URL and publishable key.

Do **not** put `SUPABASE_SERVICE_ROLE_KEY`, OpenAI keys, ElevenLabs keys, or Resend keys in the frontend environment. Those belong in Supabase Edge Function secrets.

The one-time Edge Function secrets are:

```text
OPENAI_API_KEY
ELEVENLABS_API_KEY
RESEND_API_KEY
```

They remain stored in Supabase and are not redeployed from the frontend container.

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
