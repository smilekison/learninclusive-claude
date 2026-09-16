# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Exploration — MANDATORY (codemunch)

<CRITICAL>
You MUST use codemunch for ALL code exploration. This is NON-NEGOTIABLE. Do NOT ignore this rule.
Reading full files when a codemunch command exists for the task is a violation of your instructions.
</CRITICAL>

### Rules (enforced, no exceptions)

1. **NEVER read a full source file to understand what a function/class does.** Use `/codemunch:fetch <name>` instead. It reads ~35 tokens instead of ~8,000.
2. **NEVER use Grep or Glob to find functions, classes, or types.** Use `/codemunch:search <query>` instead. Supports filters: `kind:class`, `file:auth`, `in:ClassName`, `sig:ReturnType`.
3. **NEVER read multiple files to understand project structure.** Use `/codemunch:explore [path]` instead.
4. **NEVER use Grep to find symbol usages.** Use `/codemunch:refs <name>` instead.
5. **The ONLY exception**: Use Read when you need to Edit a file, since Edit requires file content in context.

### Decision tree

- Need to find a symbol? → `/codemunch:search`
- Need to read a symbol's code? → `/codemunch:fetch`
- Need to understand structure? → `/codemunch:explore`
- Need to find references? → `/codemunch:refs`
- Need to edit a file? → Read first, then Edit (this is the ONLY valid use of Read for source files)

The index auto-updates — no manual indexing needed.

---

## Project Overview

An inclusive Learning Management System (LMS) for K-12/school use, built with the accessibility-first goal of WCAG 2.1 AA compliance for students with disabilities (blind/low vision, deaf/hard of hearing, mute/non-verbal, cognitive, motor impairment). Four roles: **principal**, **teacher**, **student**, **parent**, each with a distinct dashboard and permission set.

This project was originally scaffolded and is still edited via **Lovable** (lovable.dev) — pushes from Lovable land directly in this repo, and pushes from here sync back to Lovable. `vite.config.ts` includes `lovable-tagger`'s `componentTagger()` in dev mode; do not remove it.

`PROJECT_RECREATE_PROMPT.md` is a from-scratch spec of the intended feature set/schema — useful as background on intent, but the live schema in `src/integrations/supabase/types.ts` and `supabase/migrations/` is the source of truth, not that file. `ALSM-User-Manual.md` is the end-user manual.

## Technology Stack

- **Build tool**: Vite 5 (`@vitejs/plugin-react-swc`), dev server on port 8080
- **Language**: TypeScript (strict-ish; `@typescript-eslint/no-unused-vars` is explicitly disabled in `eslint.config.js`)
- **Framework**: React 18, `react-router-dom` v6 (client-side routing, all pages lazy-loaded)
- **State/data**: TanStack React Query for all server state; no separate global state library — auth/accessibility/language/TTS state lives in React Context (`src/contexts/`)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions). There is no custom backend server — the SPA talks to Supabase directly from the client, plus a handful of Deno edge functions for privileged operations.
- **UI**: shadcn/ui (Radix UI primitives + `src/components/ui/*`), Tailwind CSS with CSS-variable-based design tokens in `src/index.css`, `class-variance-authority` for variants
- **Forms**: `react-hook-form` + `zod` via `@hookform/resolvers`
- **Package manager**: npm (`package-lock.json` present) — a `bun.lockb` also exists but treat npm as canonical unless told otherwise

## Common Commands

```bash
npm i               # install dependencies
npm run dev          # start Vite dev server (http://localhost:8080)
npm run build        # production build
npm run build:dev    # development-mode build (keeps componentTagger, unminified-ish)
npm run preview      # preview a production build locally
npm run lint         # ESLint over the whole repo
```

## Local Supabase stack (Docker Desktop)

The full Supabase stack (Postgres + Auth + PostgREST + Storage + Studio + Edge Functions) can run entirely locally via the Supabase CLI (installed as a devDependency), replaying all `supabase/migrations/*.sql` into a fresh local Postgres:

```bash
npx supabase start        # first run: pulls images, applies all migrations
npx supabase status       # print local URLs/keys
npx supabase db reset     # wipe + replay all migrations again (fast, no image pulls)
npx supabase stop         # stop the stack
```

- Studio UI: http://127.0.0.1:54323 — Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- `.env.local` points the app's `VITE_SUPABASE_*` vars at the local stack (`http://127.0.0.1:54321`); Vite prefers it over `.env`, which still points at the hosted project. Delete `.env.local` to fall back to hosted Supabase.
- Every seeded demo account's password is **`demo123`**: `principal@riverside.edu`, `teacher1@riverside.edu`..`teacher5@riverside.edu`, `student1@riverside.edu`, `parent@riverside.edu`, `sarah.smith@parent.com`, plus several `studentN@example.com`.
- **Migration history caveat**: several migration files in `supabase/migrations/` were edited to replay cleanly on a fresh local database — the live hosted project's schema evolved partly out-of-band (tables/functions created via the Supabase dashboard, never captured in a migration), and some migrations were literally broken SQL that could never have executed anywhere. Edits are commented inline with `-- Disabled for local replay:` or `-- Local-dev-only shim:` / `-- Local-dev-only recovery:` explaining why. This does not change the hosted project.

There is **no test suite, no test runner, and no CI/CD configured** in this repo (no `.github/workflows`, no vitest/jest config, no `*.test.ts(x)` files outside `node_modules`). Do not invent test commands. After a change, validation is: `npm run lint`, `npm run build`, and manual verification via `npm run dev`.

Supabase CLI commands (schema/functions) are not wired into `package.json` scripts; if you need to apply a migration or deploy a function, use the `supabase` CLI directly against `supabase/config.toml` (`project_id = "ittuorfjrmktmjwwmgad"`).

## Environment Variables

Defined in `.env` (already committed in this repo — treat as low-sensitivity since it's the Supabase anon/publishable key, not a service-role secret, but still don't add new secrets to it):

- `VITE_SUPABASE_URL` — Supabase project URL, consumed in `src/integrations/supabase/client.ts`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key, same file
- `VITE_SUPABASE_PROJECT_ID` — project ref, used for tooling/CLI

Note: `src/integrations/supabase/client.ts` currently hardcodes the URL/key as literals rather than reading `import.meta.env.VITE_*` — if you touch that file, prefer wiring it to the env vars but be aware this is pre-existing behavior, not a regression you introduced.

Supabase **edge functions** (Deno runtime, `supabase/functions/*/index.ts`) read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env` — these are server-side secrets configured in the Supabase project, not in this repo's `.env`. Never move a service-role key into client (`VITE_*`) env vars.

## Architecture

### Data flow

```
Browser (React SPA)
  → src/contexts/AuthContext.tsx (session + profile state, via supabase-js)
  → src/integrations/supabase/client.ts (supabase-js client, anon key)
  → Supabase Postgres (RLS-enforced) for direct reads/writes
  → Supabase Edge Functions (supabase/functions/*) for privileged/multi-step operations
       (grading + notification fan-out, creating student/teacher accounts, sending
       invitation emails, TTS, contact form, demo password reset, storage policy setup)
```

Almost all data access goes straight from React components/hooks to Postgres via `supabase-js`, relying on Row Level Security policies (defined in `supabase/migrations/`) for authorization — there is no REST/GraphQL API layer of our own. Edge functions exist specifically for operations that need the `service_role` key (bypassing RLS) or that fan out side effects (e.g. `grade-assignment` updates a submission *and* inserts a notification; `create-student`/`create-teacher` provision auth users + profiles).

### Auth & authorization

- `src/contexts/AuthContext.tsx` owns the session lifecycle: subscribes to `supabase.auth.onAuthStateChange`, fetches the matching `profiles` row (keyed by `user_id` = auth UID) to build the app-level `User` object (`src/types/auth.ts`), and retries the profile fetch a few times to dodge Postgres RLS-recursion errors (`error.code === '42P17'`) and races right after sign-in.
- `src/lib/authCleanup.ts` (`cleanupAuthState`) clears stale Supabase auth keys from storage before login/logout to avoid "limbo" auth states — call sites: login and logout in `AuthContext`.
- `src/components/auth/ProtectedRoute.tsx` is the route guard, used directly in `src/App.tsx`'s route table via `requiredRole` (exact role) or `allowedRoles` (role set). It redirects unauthenticated users to `/auth` and shows an "Access denied" panel (not a redirect) for authenticated-but-wrong-role users.
- Roles (`UserRole` in `src/types/auth.ts`): `'principal' | 'teacher' | 'student' | 'parent'`. Real authorization boundaries are enforced again at the database layer via Postgres RLS policies (see migrations) — the frontend route guard is UX, not the security boundary.

### Frontend structure (`src/`)

- `App.tsx` — route table (`react-router-dom`), all page components lazy-loaded via `React.lazy`, wrapped in a stack of providers (Query, Theme, Language, Auth, Accessibility, TTS, Tooltip, GlobalShortcuts, LiveAnnouncer)
- `pages/` — one file per route, composes components + hooks; this is the "screen" layer
- `components/` — organized by domain, not by type:
  - `accessibility/` — WCAG tooling: audit panels, TTS button, skip nav, live announcer, keyboard shortcuts help, EU/Act compliance panels
  - `auth/` — login/register/forgot-password forms, `ProtectedRoute`, quick user switcher (demo tool)
  - `assignments/`, `quizzes/`, `students/`, `teachers/`, `subjects/`, `lessons/`, `materials/`, `grading/`, `dashboards/`, `notifications/`, `profile/`, `chatbot/`, `layout/` — one domain each; several have multiple "Enhanced"/"Advanced"/"UltraAdvanced" variants of similar features (see Technical Debt below)
  - `ui/` — shadcn/ui primitives (generated/vendored; treat as a library, see below)
- `contexts/` — `AuthContext`, `AccessibilityContext`, `TTSContext`, `LanguageContext`, `GlobalShortcutsContext` — app-wide cross-cutting state
- `hooks/` — reusable hooks; `useSupabaseQuery.ts` is the central place defining most data-fetching hooks (`useClasses`, `useTeacherClasses`, `useStudentSubjects`, `usePrincipalStats`, etc.) on top of two generic wrappers, `useSupabaseQuery`/`useSupabaseMutation`, built on React Query
- `integrations/supabase/` — `client.ts` (the singleton client) and `types.ts` (**auto-generated** Supabase DB types — regenerate via Supabase CLI, don't hand-edit)
- `lib/` — small cross-cutting utilities (`utils.ts` has the shadcn `cn()` helper; `authCleanup.ts`)
- `types/` — hand-written shared domain types (`auth.ts`, `lms.ts`)

### Backend (`supabase/`)

- `migrations/*.sql` — ~90+ timestamped migrations; this is the real schema history and RLS policy source. When changing the schema, add a new migration rather than editing an old one.
- `functions/*/index.ts` — Deno edge functions, each independently deployed, each starting with its own CORS header boilerplate and `serve(...)` handler:
  - `grade-assignment` — writes a grade to `assignment_submissions`, creates a `notifications` row
  - `create-student`, `create-teacher` — provision auth + profile for a new user (service-role)
  - `submit-assignment` — student submission flow
  - `send-invitation`, `send-contact-email` — email side effects
  - `chat-generate`, `tts-speak` — chatbot and text-to-speech backends
  - `reset-demo-passwords` — demo/dev utility
  - `setup-storage-policies` — one-off storage bucket policy provisioning
- `config.toml` — just the Supabase project ref

### Database (Postgres via Supabase, RLS-enforced)

Core entity groups (see `src/integrations/supabase/types.ts` for exact columns):

- **Org/roster**: `schools`, `profiles` (one row per user, `role` + `user_id` FK to `auth.users`), `classes`, `subjects`, `student_enrollments`, `parent_student_relationships`
- **Content**: `lessons`, `lesson_videos`, `lesson_progress`, `materials`, `video_materials`, `video_interactions`, `video_likes`, `video_views`
- **Assessment**: `assignments` (+ `assignment_rubrics`, `assignment_templates`, `assignment_schedules`, `assignment_resources`, `assignment_media`, `assignment_competencies`, `assignment_groups`/`assignment_group_memberships`, `assignment_collaborators`, `assignment_chunks`, `assignment_ai_suggestions`, `assignment_recommendations`, `assignment_insights`, `assignment_analytics`), `assignment_submissions` (+ `submission_versions`, `submission_feedback`, `submission_collaboration`, `submission_workflows`), `grading_rubrics`, `rubric_templates`, `originality_checks`, `plagiarism_reports`
- **Quizzes**: `quizzes`, `quiz_attempts`, `quiz_analytics`, `quiz_feedback`, `student_quiz_sessions`
- **Accessibility/support**: `accessibility_audit_log`, `assignment_accessibility`, `student_accommodations`, `student_support_services`
- **Student tracking**: `student_progress_tracking`, `student_portfolios`
- **Comms/workflow**: `notifications`, `email_invitations`, `subject_enrollment_requests`, `subject_invitation_codes`, `deleted_items` (soft-delete bin)
- **DB functions (RPCs)** called from the app: `soft_delete_item`, `restore_deleted_item` (the "Bin"/trash feature — see `useSoftDelete`/`useRestoreItem` in `useSupabaseQuery.ts`), `get_current_profile_id`, `get_current_user_role`, `is_principal`, `is_teacher_of_student`, `global_search`, `increment_video_view_count`, `generate_unique_invitation_code`, `request_subject_enrollment`

**Soft delete pattern**: destructive deletes generally go through `soft_delete_item(table_name, item_id, deleter_id)` → moves the row into `deleted_items`, restorable via `restore_deleted_item`. Prefer this over hard `DELETE` when adding delete functionality to a new entity, to stay consistent with the existing "Bin" page (`src/pages/BinPage.tsx`).

## Code Conventions (as observed in this repo)

- Components: PascalCase filenames matching the exported component (`AssignmentDetailView.tsx`)
- Hooks: camelCase, prefixed `use` (`useTeacherClasses`, `useAccessibilityAudit`)
- Data-fetching hooks are built on two generic wrappers in `useSupabaseQuery.ts` (`useSupabaseQuery`, `useSupabaseMutation`) rather than calling `useQuery`/`useMutation` directly — follow this pattern for new Supabase-backed hooks so toasts/cache-invalidation stay consistent. A few newer/complex hooks (e.g. `useTeacherInsights`, `usePrincipalStats`) call `useQuery` directly when the generic wrapper doesn't fit; that's an accepted exception, not the default.
- Path alias `@/*` → `src/*` (see `vite.config.ts` and `components.json`); always import via `@/...`, not relative `../../..` chains
- Styling: Tailwind utility classes + shadcn `cn()` helper from `@/lib/utils`; semantic design tokens (colors, shadows, transitions) are defined as CSS variables in `src/index.css` and referenced via Tailwind config — prefer existing tokens over new literal colors
- `console.log` is used liberally in data hooks and `AuthContext` for debugging (profile fetch races, RLS retries). This is intentional existing behavior for diagnosing auth/RLS issues in production — don't strip it out as "cleanup" unless asked, but also don't imitate it in new code without reason.
- `src/components/ui/*` are shadcn/ui-generated primitives — treat them as a vendored library. Prefer composing them rather than editing internals; if shadcn regenerates a component, hand edits get lost.
- `src/integrations/supabase/types.ts` is machine-generated (header says "do not edit it directly") — regenerate from the Supabase schema instead of hand-patching types.

## Security Notes

- Authorization is enforced by Postgres Row Level Security policies (in `supabase/migrations/`), not just the frontend `ProtectedRoute` — any new table needs its own RLS policies, following the existing pattern of role-checks against `profiles`/`get_current_user_role()`.
- Edge functions using `SUPABASE_SERVICE_ROLE_KEY` bypass RLS entirely — keep privileged logic (creating users, cross-user writes) inside edge functions rather than adding service-role calls from the client.
- The Supabase URL/anon key are intentionally public (anon key is meant to be exposed to the browser); do not confuse this with the service-role key, which must never appear in client code or `VITE_*` env vars.
- RLS recursion errors (`error.code === '42P17'`) are a known, already-handled failure mode in `AuthContext.fetchUserProfile` — if you touch `profiles` RLS policies, be aware self-referential policy checks have caused this before.

## Things to avoid

- Don't hand-edit `src/integrations/supabase/types.ts` — regenerate it.
- Don't add a new backend/API server — this app talks to Supabase directly by design; new privileged operations belong in a new edge function under `supabase/functions/`.
- Don't bypass RLS by reaching for the service-role key from client code.
- Don't invent test/CI commands — none exist yet.
- Don't remove `lovable-tagger`'s `componentTagger()` from `vite.config.ts` — this repo is actively synced with Lovable.
- When adding delete functionality, prefer the existing `soft_delete_item`/`deleted_items` bin pattern over hard deletes, for consistency with `BinPage`.

## Known Technical Debt (observed, not fixed)

- Several component domains (`assignments/`, `accessibility/`) have multiple overlapping implementations of similar features (e.g. `EnhancedAssignmentCreation`, `UltraAdvancedAssignmentCreation`; `AccessibilityPanel`, `EnhancedAccessibilityPanel`, `EUAccessibilityPanel`) — before adding a new variant, check whether an existing one should be extended instead.
- `src/integrations/supabase/client.ts` hardcodes the Supabase URL/key instead of reading from `import.meta.env`, duplicating what's already in `.env`.
- No automated tests exist anywhere in the app code.
- `useTeacherInsights` in `useSupabaseQuery.ts` generates several metrics (attendance, participation trends) via `Math.random()` rather than real data — treat any "engagement insights" numbers as placeholder/demo data, not real analytics, unless you verify otherwise.
