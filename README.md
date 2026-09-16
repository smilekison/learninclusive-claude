# LearnInclusive

An accessibility-first Learning Management System for K-12 schools, built toward WCAG 2.1 AA compliance for students with disabilities (blind/low vision, deaf/hard of hearing, mute/non-verbal, cognitive, motor impairment). Four roles — **principal**, **teacher**, **student**, **parent** — each with a dedicated dashboard.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite, shadcn/ui (Radix UI) + Tailwind CSS
- **State/data**: TanStack React Query, React Context for cross-cutting concerns (auth, accessibility, TTS, language)
- **Backend**: Supabase — Postgres (with Row Level Security), Auth, Storage, Edge Functions

This project was originally scaffolded and is still synced with **[Lovable](https://lovable.dev/projects/25dac2cb-1044-4c6b-8592-655b4cc9c980)** — pushes here sync back to Lovable and vice versa.

## Getting started

```sh
npm i
npm run dev          # starts at http://localhost:8080
```

By default the app points at the hosted Supabase project (`.env`). To run entirely locally instead:

```sh
npx supabase start   # first run pulls Docker images and applies all migrations
```

This spins up the full stack (Postgres + Auth + REST + Storage + Edge Functions + Studio) via Docker Desktop. `.env.local` (git-ignored) points the app at it — delete that file to go back to the hosted project. Full instructions, including seeded demo accounts, are in [`CLAUDE.md`](./CLAUDE.md).

## Other commands

```sh
npm run build         # production build
npm run build:dev     # development-mode build
npm run preview        # preview a production build locally
npm run lint            # ESLint over the whole repo
npx supabase db reset   # rebuild the local database from migrations + seed data
```

## Project docs

- [`CLAUDE.md`](./CLAUDE.md) — architecture, local dev setup, and conventions, written for anyone (human or AI) picking up this codebase
- [`UPGRADE.md`](./UPGRADE.md) — gap analysis: what's solid today and what's missing to run this as a real product for real schools
- [`ALSM-User-Manual.md`](./ALSM-User-Manual.md) — end-user manual

## Deployment

Open [Lovable](https://lovable.dev/projects/25dac2cb-1044-4c6b-8592-655b4cc9c980) and use Share → Publish. Custom domains are supported under Project → Settings → Domains — see [Lovable's guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide).
