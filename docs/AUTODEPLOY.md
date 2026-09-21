# AutoDeploy production deployment

LearnInclusive is deployed by the existing AutoDeploy SERVICE target. **Do not run a separate bootstrap script on the server.**

## AutoDeploy environment

Set these runtime environment variables on the LearnInclusive target:

```text
VITE_SUPABASE_URL=https://supabase.smilekisan.com
VITE_SUPABASE_PUBLISHABLE_KEY=<self-hosted Supabase publishable key>
```

That is all the LearnInclusive frontend needs from Supabase.

The values are injected when the container starts, so the same Docker image can be deployed to a new server without rebuilding it for a different Supabase URL/key.

The publishable key is safe for browser use; do not put `SUPABASE_SECRET_KEY`, `SERVICE_ROLE_KEY`, database passwords, or provider API secrets in the frontend environment. Supabase documents the publishable key as the client-side credential and the secret key as server-side only. citeturn1search9

## Self-hosted Supabase

The Supabase installation is a separate service stack on the same server. LearnInclusive does **not** attempt to start Supabase from inside its frontend container.

The expected production topology is:

```text
44.206.124.17
├── learn.smilekisan.com
│   └── AutoDeploy -> LearnInclusive container
│
└── supabase.smilekisan.com
    └── self-hosted Supabase API gateway
        ├── Auth
        ├── PostgREST
        ├── PostgreSQL
        ├── Storage
        ├── Realtime
        └── Edge Functions
```

Supabase's current self-hosted Docker deployment runs the API gateway on port 8000 and recommends putting HTTPS/reverse proxying in front of it for production. citeturn1search0turn1search1

## Edge Functions

The frontend invokes functions through:

```text
https://supabase.smilekisan.com/functions/v1/<function>
```

The functions themselves and their secrets belong to the self-hosted Supabase functions service, not the LearnInclusive frontend container. Supabase documents `.env.functions` as the appropriate place for custom Edge Function secrets. citeturn1search5

For this project, server-side secrets include:

```text
OPENAI_API_KEY
ELEVENLABS_API_KEY
RESEND_API_KEY
SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY
```

Do not expose those through `VITE_*` variables.

## Database migrations

Database migrations belong to the self-hosted Supabase Postgres installation:

```text
supabase/migrations/
        ↓
self-hosted Supabase PostgreSQL
```

The LearnInclusive frontend image does not require Docker-socket access and does not manipulate Supabase containers.

## Fresh server requirement

AutoDeploy can deploy the LearnInclusive application automatically, but a full self-hosted Supabase installation is a separate multi-container infrastructure stack. Supabase officially distributes that stack as Docker Compose and it must exist on the server before the frontend can use it. citeturn1search1

Therefore a fresh server needs the Supabase infrastructure provisioned once. After that, normal LearnInclusive deployments are simply:

```text
git push
   ↓
AutoDeploy
   ↓
build LearnInclusive
   ↓
inject VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
   ↓
start container
   ↓
application uses self-hosted Supabase
```
