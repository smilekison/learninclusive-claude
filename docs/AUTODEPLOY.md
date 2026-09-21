# AutoDeploy production deployment

LearnInclusive is deployed by the existing AutoDeploy SERVICE target. **Do not run a separate bootstrap script on the server.**

## AutoDeploy environment

Leave the LearnInclusive target environment empty for the Supabase connection. The repository's `autodeploy.integrations.json` declaration causes AutoDeploy to provision the self-hosted Supabase service and inject the generated client configuration at runtime.

The same Docker image can therefore be deployed to a new server without baking a Supabase URL or key into the image.

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

A fresh server does not require a separate LearnInclusive bootstrap step. When AutoDeploy sees `autodeploy.integrations.json`, its generic integration runner provisions the self-hosted Supabase stack before the application is started. citeturn1search1

Normal deployments are:

```text
GitHub main
   ↓
AutoDeploy
   ↓
detect optional integrations
   ↓
provision/reuse self-hosted Supabase
   ↓
apply migrations + functions
   ↓
inject generated VITE_* runtime configuration
   ↓
build/start LearnInclusive
```

## Automatic self-hosted Supabase

This repository declares its Supabase dependency in `autodeploy.integrations.json`. AutoDeploy's generic integration runner uses that declaration to provision the official self-hosted Supabase Docker stack on the same SSH host, configure:

- `https://supabase.smilekisan.com`
- `https://learn.smilekisan.com` as the Auth site URL
- generated publishable/secret API keys
- the repository's Edge Functions
- database migrations under `supabase/migrations`
- HTTPS routing through the host's existing Nginx/Certbot

The generated `SUPABASE_PUBLISHABLE_KEY` is injected into the LearnInclusive container at runtime. Server-side Supabase credentials are never placed in the browser bundle.

External function secrets such as `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, and `RESEND_API_KEY` remain optional AutoDeploy target environment values. If supplied, AutoDeploy writes them to the self-hosted Functions environment on the server.

No Supabase installation script needs to be run manually for this repository. The server must have enough capacity for the full self-hosted stack; Supabase currently documents 4 GB RAM / 2 CPU / 40 GB SSD as minimums and 8 GB+ RAM / 4 CPU / 80 GB+ SSD as recommended for the complete stack.
