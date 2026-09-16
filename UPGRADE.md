# UPGRADE.md — From Project to Product

An honest assessment of what this codebase is today, and what it actually takes to run it as a real company serving real schools with real students' data. Written after a full pass over the schema, RLS policies, edge functions, frontend, and CRUD paths — not a generic checklist.

## 1. What's genuinely solid today

- **Accessibility is taken seriously, not bolted on.** Dedicated context providers (TTS, accessibility preferences), keyboard navigation hooks, live regions, skip links, an accessibility statement page, and axe-core wired into the app. This is a real differentiator most edtech competitors don't have — lean into it.
- **The data model is thoughtful.** Multi-role (principal/teacher/student/parent), soft-delete pattern, invitation-code-based enrollment, rubric-based grading, accommodation tracking. Someone designed this with real classroom workflows in mind, not just a CRUD demo.
- **RLS-first authorization.** Every table has row-level security tied to role and ownership, not just frontend route guards. That's the right instinct for multi-tenant education data.
- **CRUD paths work end-to-end.** Verified this session: subject/assignment create-read-update-delete, student submission, teacher grading (both direct and via edge function), and every notification trigger — all fire correctly against a clean database.

## 2. The uncomfortable truth: this is a prototype, not a product

Nothing below is a knock on the work — it's normal for a project built fast with AI-assisted tooling (Lovable) to prioritize features over infrastructure. But there's a real gap between "the demo works" and "a school district trusts you with their students' data," and that gap is where companies actually die.

### 2.1 Security & compliance — the highest-priority gap

This is a K-12 education product. That means:

- **No FERPA/COPPA posture exists.** There's no data processing agreement template, no documented data retention/deletion policy, no parental consent flow for under-13 users, no audit trail for who accessed a student's record and when (the `accessibility_audit_log` table tracks accessibility feature usage, not data access). A single district procurement review will ask for a FERPA compliance statement and there is currently nothing to hand them.
- **No privacy policy or terms of service.** There's an accessibility statement page but no privacy policy, no ToS, no cookie policy. These aren't optional for a product that touches minors' data.
- **Secrets hygiene is loose.** `.env` (with the Supabase anon key) is committed to git history. The anon key itself is low-risk by design, but the *habit* is the problem — there's no `.gitignore` entry for env files, so the first real secret (an SMTP key, an AI provider key) will get committed the same way. `SUPABASE_SERVICE_ROLE_KEY` usage is correctly confined to edge functions today; that discipline needs to be enforced by tooling (secret scanning in CI), not just convention.
- **No dependency vulnerability scanning.** No Dependabot/Renovate config, no `npm audit` in CI. `npm audit` reported 21 vulnerabilities (1 low, 4 moderate, 16 high) during setup this session — nobody is currently watching that number.
- **No rate limiting or abuse protection** on edge functions (`send-invitation`, `send-contact-email`, `chat-generate`) — all are exploitable for spam/cost abuse by anyone with the public anon key, which is, by design, public.
- **No incident response plan.** If student data leaks, there is currently no documented process for who gets notified, in what timeframe, or how affected families are informed — several US states have legal notification deadlines for this.

### 2.2 Architecture — will not survive scale or a real engineering team

- **No backend API layer.** The frontend talks directly to Postgres via PostgREST, with business logic split awkwardly between RLS policies, database triggers, and a handful of edge functions. This works for one team moving fast, but it means: no request validation layer, no rate limiting, no API versioning, and every business-rule change requires a database migration instead of an application deploy. A growing engineering team will trip over this constantly — nobody can reason about "what happens when X" without reading SQL trigger bodies.
- **Migration history is not trustworthy.** Over 90 migration files exist that reference tables, columns, and functions that were never actually created by any migration — they were built directly on the hosted database via the Supabase dashboard and never captured as code. This session found and fixed ~40 broken/duplicate/out-of-order migrations, a missing column (`student_enrollments.created_at`) that silently existed only on production, a missing RPC function, and a live bug (subject creation crashing when no description is given, because a notification trigger did unguarded NULL concatenation). **If the migration history can't reliably rebuild the database from scratch, you don't have infrastructure-as-code — you have a very detailed diary of manual dashboard edits.** This is the single highest-leverage fix available: it's already been done for local dev in this session; the same discipline (every schema change is a migration, nothing done by hand in the dashboard) needs to become a hard rule going forward.
- **No staging environment.** There's local dev (now working) and hosted production. Nothing in between to test a migration or a risky feature against realistic data before it hits real schools.
- **Client-side role checks are UX, not security** (correctly backed by RLS) — but there's no server-side audit of *whether the RLS policies are actually sufficient*. Nobody has done a formal threat model of "what can a malicious authenticated student actually do."

### 2.3 Testing — there is none

Zero test files anywhere in the codebase. No unit tests, no integration tests, no E2E tests, no CI pipeline to run them even if they existed. For a product with 90+ database migrations and complex RLS policies, this means every change is verified by manually clicking through the app (or not verified at all). Concretely missing:

- Unit tests for the ~15 database RPC functions and trigger functions (the exact class of bug found this session — NULL concatenation in a trigger — is precisely what a `pgTAP` test catches in CI before it ships).
- Component/integration tests for the accessibility features, which are the product's actual differentiator and the most expensive thing to regress silently.
- E2E tests for the four core user journeys (principal onboarding a school, teacher creating and grading an assignment, student submitting work, parent viewing progress).
- RLS policy tests — a dedicated test suite that logs in as each role and asserts what it can and cannot see/modify. This is standard practice for Supabase projects and currently doesn't exist.

### 2.4 CI/CD & operations

- No GitHub Actions (or any CI) at all — no lint-on-PR, no build-on-PR, no automated migration-apply check.
- No deployment pipeline visible — unclear how "push to main" becomes "live on the hosted Supabase project + wherever the frontend is hosted." If this is still "Lovable auto-syncs," that's fine for a solo builder and a liability for a team.
- No observability: no error tracking (Sentry or equivalent), no APM, no uptime monitoring, no structured logging. The codebase currently relies on `console.log` in the auth flow for debugging production issues — that means when something breaks for a real user, the response would rely on the user reporting it, then browsers to console log to debug.
- No backup/disaster-recovery story documented. Supabase's hosted Postgres has point-in-time recovery on paid tiers, but there's no evidence anyone has verified it's enabled, tested a restore, or documented an RPO/RTO target.

### 2.5 Product/business readiness

- **No billing/subscription infrastructure.** If the plan is to sell this to schools, there is no plan tier model, no Stripe (or equivalent) integration, no usage metering, no way to gate features by plan.
- **No multi-tenancy isolation story beyond RLS.** All schools share one Postgres database with row-level filtering. That's fine at small scale; it becomes a real question at scale ("can one school's admin somehow see another's data via a policy bug") and a question every enterprise security review will ask directly.
- **No admin/ops tooling.** There's a "Bin" (soft-delete recovery) page for end users, but nothing for the *company running this* — no way to see all schools, all usage, all support tickets, impersonate a user for support purposes (safely, with audit logging), or kill a runaway account.
- **No customer support infrastructure** — no help desk integration, no in-app support/feedback channel beyond the contact-email edge function.
- **No usage analytics for the business** (distinct from the in-app "insights" feature for teachers) — nobody running this as a company currently has visibility into activation, retention, or which features are actually used.
- **No demo/sandbox environment separate from real data** — the demo accounts (`principal@riverside.edu` etc.) exist as rows in the same database as any real school's data would be, with no visible separation. A prospective customer demo and real student data should never share infrastructure.

## 3. What to actually do about it — a realistic order of operations

Not everything above needs solving before another line of feature code ships. Roughly in the order it stops mattering vs. starts mattering:

**Before onboarding any real school (non-negotiable):**
1. Fix the migration-history discipline: no more dashboard-only schema changes, every change is a reviewed migration file, CI applies migrations to a scratch database on every PR to prove they replay cleanly. (Mechanism for this already exists locally after this session's work — turn it into a CI check.)
2. Write and publish a privacy policy and ToS. Get a lawyer who's done this for edtech, even briefly — FERPA/COPPA specifics matter and are easy to get wrong.
3. Add basic CI: lint, build, and a migration-replay check on every PR. This is a few hours of work and catches the exact class of bug this session spent hours fixing by hand.
4. Add error tracking (Sentry's free tier is enough to start) so production failures aren't silent.
5. Do one focused RLS audit: for each of the four roles, write down what they should and shouldn't be able to do, then verify the policies actually enforce it. This is the highest-value security work available right now.

**Before charging money for it:**
6. Billing integration and plan-gating.
7. A real staging environment.
8. An admin console for support/ops (even a minimal internal tool).
9. A documented incident response process.
10. Automated tests for the RPC/trigger layer at minimum — that's where the highest-blast-radius bugs live (a bad trigger can silently corrupt or block data for every user of a feature, as the subject-creation bug this session found did).

**Before it's "the company," not "the product":**
11. A real backend API layer (or at minimum, move business logic out of database triggers into edge functions/an API service, so it's testable and deployable independent of schema changes).
12. Multi-tenancy hardening beyond RLS (dedicated schemas or database-per-tenant for larger customers, if enterprise sales ever require it).
13. A support/success team workflow, not just support tooling.
14. Dependency and security scanning as a standing process, not a one-time audit.

## 4. The honest bottom line

The product idea and the accessibility-first execution are genuinely good — that's not nothing, and it's the hardest part to fake. But right now this is a well-designed prototype sitting on infrastructure that would not survive a serious security review, a school district's procurement process, or a second engineer joining the team without a lot of tribal knowledge transfer. None of the gaps above are exotic or require reinventing anything — they're the standard, boring, unglamorous work every real SaaS company does before it's allowed to hold other people's data. The good news: the hard part (a thoughtful data model and a real accessibility story) is already done. What's left is discipline, not invention.
