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

\`\`\`powershell
.\\scripts\\start-local.ps1
\`\`\`

The script runs Supabase through Docker Desktop, applies the repository's migrations/seed configuration, builds the LearnInclusive image, and starts it.

### Linux

Install Docker Engine/Compose v2 and Node.js LTS, then run:

\`\`\`bash
./scripts/start-local.sh
\`\`\`

The same repository-owned workflow is used; Supabase runs in Docker.

### Local URLs

- LearnInclusive: http://localhost:18080
- Supabase API: http://127.0.0.1:54321
- Supabase Studio: http://127.0.0.1:54323

To stop the local Supabase stack:

\`\`\`bash
npx supabase stop
\`\`\`

The same command works from PowerShell.

## Production / self-hosted server

For production, use the repository-owned deployment wrapper. It provisions the official self-hosted Supabase Docker stack, reads the generated \`SUPABASE_PUBLISHABLE_KEY\`, writes the application environment file, and starts LearnInclusive.

### Linux

\`\`\`bash
./scripts/deploy-production.sh
\`\`\`

By default this is configured for:

- LearnInclusive: \`https://learn.smilekisan.com\`
- Supabase API: \`https://supabase.smilekisan.com\`

You can override the Supabase hostname if your reverse proxy uses a different public URL:

\`\`\`bash
SUPABASE_PUBLIC_URL=https://supabase.example.com \\
SITE_URL=https://learn.smilekisan.com \\
./scripts/deploy-production.sh
\`\`\`

### Windows / Docker Desktop

\`\`\`powershell
.\\scripts\\deploy-production.ps1
\`\`\`

The wrapper creates \`.runtime\\\\learninclusive.env\` from the repository-owned Supabase configuration. The publishable key is never committed to Git.

The root \`Dockerfile\` builds only the LearnInclusive web application. Supabase is intentionally a separate Docker workload because self-hosted Supabase is a multi-container system.

## Deployment-platform independence

A deployment platform can clone this repository and execute its standard Docker/Compose workflow. It does not need a LearnInclusive-specific plugin or Supabase integration.

The application repository owns:

- Supabase configuration
- database migrations
- Edge Functions
- application Docker image
- local Docker workflow
- self-hosted Supabase bootstrap
- production environment generation

The deployment platform owns only generic deployment concerns such as cloning, building, starting containers, networking, secrets injection, and health checks.

There is no application dependency on a particular deployment platform.

## Configuration

The browser application uses:

- \`VITE_SUPABASE_URL\`
- \`VITE_SUPABASE_PUBLISHABLE_KEY\`

The production wrapper obtains \`VITE_SUPABASE_PUBLISHABLE_KEY\` from the self-hosted Supabase \`.env\` instead of requiring a human to copy it manually. Supabase documents this key as the client-side publishable key for self-hosted deployments.

Never put server-only Supabase credentials or Edge Function secrets in \`VITE_*\` variables.
