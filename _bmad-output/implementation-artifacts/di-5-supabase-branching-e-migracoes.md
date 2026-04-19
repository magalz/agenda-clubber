# Story DI.5: Supabase Branching e Workflow de Migrações

Status: ready-for-dev

## Story

As a developer,
I want each feature branch to have its own isolated database branch with automated migrations,
so that schema changes can be tested safely without affecting shared development or production databases.

## Pre-requisites

- Supabase CLI already installed locally (confirmed in environment).
- Story DI.4 landed (provides the GitHub Actions workflow to extend).

## Acceptance Criteria

1. **Supabase Branching Enabled:** Supabase Branching enabled on the `agenda-clubber` project via Supabase dashboard. Requires Supabase Pro or applicable plan — confirm entitlement before executing.
2. **Automated Branch Lifecycle in CI:** The GitHub Actions workflow from DI.4 is extended to:
    - On PR open/update: create (or ensure exists) a Supabase branch corresponding to the PR (`supabase branches create <branch-name>` or via PR GitHub integration).
    - On PR close/merge: delete the Supabase branch (`supabase branches delete <branch-name>`).
3. **Automated Drizzle Migrations:** The CI workflow runs `drizzle-kit push` (or `drizzle-kit migrate`) against the PR's Supabase branch before the test/build steps. Migrations run against an ephemeral, per-PR database — never against production.
4. **Vercel Preview Uses PR's Supabase Branch:** Vercel Preview Deployments (from DI.4) are configured to point their `NEXT_PUBLIC_SUPABASE_URL` and related vars to the PR's Supabase branch. Preview and preview-DB are always in sync. (Use Supabase's Vercel integration for automatic wiring.)
5. **Migration Workflow Documented:** Documentation (in `CONTRIBUTING.md` / README following DI.2) explains the flow: developer generates migration locally (`drizzle-kit generate`) → commits + pushes → CI runs migration against PR Supabase branch → PR merged → migration runs against production DB.
6. **Local Dev Workflow Documented:** Documentation covers local migration commands: `supabase start` (if using local Supabase), `drizzle-kit generate`, `drizzle-kit push`, and how to sync a local DB with a remote branch if needed.
7. **Production Migration Strategy Defined:** The decision for production migrations (auto-run on merge vs. manual approval step) is documented with rationale. **Recommended:** manual approval via workflow_dispatch for early phase, auto-run once confidence is high.
8. **RLS Parity:** Confirm that RLS policies applied via Drizzle/migrations propagate correctly to Supabase branches (Supabase Branching replicates schema + RLS from main branch).

## Tasks / Subtasks

- [ ] **Verify Plan/Entitlement (AC: 1)**
  - [ ] Check Supabase project plan — Branching requires Pro or higher
  - [ ] If not entitled, flag to Project Lead and block story until upgraded or alternative strategy chosen
- [ ] **Enable Branching (AC: 1)**
  - [ ] Supabase dashboard → Project settings → enable Branching
  - [ ] Grant GitHub integration permissions
- [ ] **Install Supabase Vercel Integration (AC: 4)**
  - [ ] Use the official Supabase-Vercel integration (marketplace) to auto-wire env vars per environment
  - [ ] Confirm preview deployments receive branch-specific Supabase credentials
- [ ] **Extend CI Workflow (AC: 2, 3)**
  - [ ] Add step `Setup Supabase CLI` (via `supabase/setup-cli` GH Action)
  - [ ] Add step to create/link Supabase branch for the PR
  - [ ] Add step `drizzle-kit push` or `drizzle-kit migrate` using the branch's `DATABASE_URL` (fetched via `supabase branches get`)
  - [ ] Add `pull_request: closed` trigger to delete the branch on merge/close
  - [ ] Verify the flow with a test PR that includes a trivial migration
- [ ] **Document Migration Workflow (AC: 5, 6, 7)**
  - [ ] Add `## Database Migrations` section to CONTRIBUTING.md
  - [ ] Local workflow: generate → review → commit → push → CI applies to branch
  - [ ] Production strategy decision + rationale
- [ ] **RLS Parity Validation (AC: 8)**
  - [ ] Create a test migration that adds a new table with RLS
  - [ ] Open a PR → confirm the Supabase branch has the RLS policies applied
  - [ ] Document any caveats discovered

## Dev Notes

- **Why branching matters:** Without this, the team either (a) shares one dev DB (risk of stomping migrations between PRs) or (b) requires every dev to run Supabase locally (friction). Branching gives isolation with zero local setup.
- **Supabase-Vercel integration is the recommended path** — it wires env vars automatically per deployment. Manual `vercel env` management per branch is error-prone.
- **Migration strategy decision is architectural:** auto-run is faster but riskier for destructive migrations. Manual approval gate via `workflow_dispatch` with a reviewer is safer for MVP phase. Document the chosen approach with reasoning.
- **Drizzle vs Supabase migrations:** The project uses Drizzle for schema source of truth (`src/db/schema/*.ts`). Drizzle generates SQL, which is applied via `drizzle-kit push` (dev) or `drizzle-kit migrate` (prod). Supabase Branching provides the ephemeral DB targets.
- **Cost awareness:** Each Supabase branch consumes resources. Auto-cleanup on PR close is essential.

### References

- [Epic 1 Retrospective](_bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md) — Épico DevOps scope
- [Epics - DevOps/Infra](_bmad-output/planning-artifacts/epics.md#epic-devops-infra-governanca-de-ambiente-e-pipeline-de-qualidade)
- [Architecture - Data Architecture & Branching](_bmad-output/planning-artifacts/architecture.md)
- [Supabase Docs - Branching](https://supabase.com/docs/guides/platform/branching)
- [Supabase Docs - Vercel Integration](https://supabase.com/docs/guides/platform/vercel)

## Dev Agent Record

### Agent Model Used
_(to be filled by implementing agent)_

### Implementation Plan
_(to be filled by implementing agent)_

### Completion Notes
_(to be filled by implementing agent)_

### File List
- `.github/workflows/ci.yml` (extend with Supabase branch lifecycle + migration steps)
- `CONTRIBUTING.md` or `README.md` (migration workflow docs)
- `drizzle.config.ts` (if adjustments needed for branch-per-PR env)

### Review Findings
_(to be filled by reviewer)_

### Change Log
_(to be filled by implementing agent)_
