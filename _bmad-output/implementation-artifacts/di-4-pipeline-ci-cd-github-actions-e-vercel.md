# Story DI.4: Pipeline CI/CD com GitHub Actions e Vercel

Status: ready-for-dev

## Story

As a developer,
I want every PR to be automatically validated with a full quality pipeline and get a Vercel preview deployment,
so that regressions are caught before merge and stakeholders can review changes live.

## Acceptance Criteria

1. **GitHub Actions Pipeline Order:** `.github/workflows/ci.yml` executes, in order: checkout → setup Node (version from `.nvmrc` or explicit) → `npm ci` → `npm run lint` → `npm run type-check` (or `tsc --noEmit`) → `npm run test` (Vitest) → `npm run build` → `npm run test:e2e` (Playwright).
2. **Playwright Uses Production Build (Tech Debt Item #5):** `playwright.config.ts` `webServer` is updated from `npm run dev` to `npm run build && npm run start` (or `npm start`). E2E runs against the production build, not the dev server.
3. **Middleware Mocks Robust (Tech Debt Item #6):** Fragile `NextRequest`/`NextResponse` mocks in `src/middleware.test.ts` are replaced using real `Request`/`Response` constructors (preferred) or `node-mocks-http`. Tests pass without relying on brittle mock internals.
4. **GitHub Secrets Configured:** All required secrets configured in GitHub Actions: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SENTRY_DSN`. A dedicated test Supabase project or branch is used for CI (real prod DB must NOT be reachable from CI).
5. **Vercel-GitHub Integration:** Vercel project connected to the GitHub repo. Every PR automatically receives a Vercel Preview Deployment URL as a bot comment on the PR.
6. **Vercel Production Deploy:** Merge to `main` automatically triggers a Vercel production deployment.
7. **Vercel Env Var Separation:** Vercel environment variables configured for `preview` and `production` environments separately. Preview uses the test/staging Supabase; production uses the production Supabase (the prod URL is NOT leaked to preview).
8. **Pipeline Green on Main:** All pipeline steps complete successfully on the `main` branch after merge of this story.
9. **Pipeline Failure Blocks Merge:** When the CI workflow fails, GitHub refuses to merge the PR (ties into DI.3 required status check).

## Tasks / Subtasks

- [ ] **Update `playwright.config.ts` (AC: 2)**
  - [ ] Change `webServer.command` from `npm run dev` to `npm run start` (with `npm run build` as a dedicated build step in CI before Playwright runs)
  - [ ] Ensure `webServer.url` and port match production defaults
  - [ ] Run locally: `npm run build && npm run start` + `npm run test:e2e` → confirm tests still pass
- [ ] **Harden Middleware Tests (AC: 3)**
  - [ ] Audit `src/middleware.test.ts` for mock fragility
  - [ ] Replace manual `NextRequest`/`NextResponse` mocks with real constructor usage (preferred) or install `node-mocks-http` if justified
  - [ ] Confirm tests still cover all middleware branches (auth guard redirect, `/admin` DB check, public route pass-through)
- [ ] **Expand CI Workflow (AC: 1, 4)**
  - [ ] Review current `.github/workflows/ci.yml` from Story 1.0
  - [ ] Ensure pipeline steps follow the full order from AC 1
  - [ ] Add Playwright step running after `npm run build`
  - [ ] Configure env via `${{ secrets.* }}` for all required variables
  - [ ] Add caching for `node_modules` and Playwright browsers to reduce CI time
- [ ] **Configure GitHub Secrets (AC: 4)**
  - [ ] Create a dedicated CI Supabase project OR use Supabase branching (coordinate with DI.5)
  - [ ] Add all secrets via `gh secret set` or GitHub UI
  - [ ] Document secret names (not values!) in DI.2 setup docs
- [ ] **Configure Vercel Project (AC: 5, 6, 7)**
  - [ ] Create Vercel project and connect to the GitHub repo
  - [ ] Set framework preset to Next.js (auto-detected)
  - [ ] Configure environment variables separately for `Preview` and `Production`
    - Preview: test/CI Supabase credentials
    - Production: production Supabase credentials
  - [ ] Confirm PR bot comment with preview URL works on a test PR
  - [ ] Confirm production deploy triggers on merge to `main`
- [ ] **End-to-End Smoke Test (AC: 8, 9)**
  - [ ] Open a test PR with an intentional test failure → confirm CI fails + merge blocked
  - [ ] Fix the test → confirm CI passes + merge allowed
  - [ ] Merge to `main` → confirm production deploy succeeds
  - [ ] Verify production URL renders the app correctly

## Dev Notes

- **Tech debt resolved:** This story resolves items #5 (E2E uses dev server) and #6 (fragile middleware mocks) from the Epic 1 retrospective tech debt list.
- **Dependency order:**
  - Hard dependency: DI.3 (branch protection must be configured to enforce CI as required check — but DI.3 needs this workflow to exist first to reference its name). **Execute: land workflow file in DI.4 → configure DI.3 → then land remaining DI.4 optimizations.**
  - Soft dependency: DI.5 (Supabase branching for per-PR DB) — can land after, pipeline initially uses static CI DB.
- **Secrets scope:** NEVER place `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` anything. Service role is server-only.
- **Playwright + Next.js build:** Playwright's `webServer.reuseExistingServer: true` is safe in CI because CI always starts fresh.
- **Cost awareness:** A test Supabase project on the free tier is sufficient for CI.

### References

- [Epic 1 Retrospective](_bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md) — Tech Debt items #5, #6
- [Epics - DevOps/Infra](_bmad-output/planning-artifacts/epics.md#epic-devops-infra-governanca-de-ambiente-e-pipeline-de-qualidade)
- [Architecture - Hosting & CI/CD](_bmad-output/planning-artifacts/architecture.md)
- [Story 1.0 - Initial CI Scaffold](_bmad-output/implementation-artifacts/1-0-inicializacao-do-projeto-e-infraestrutura-base.md)
- [Playwright Docs - webServer](https://playwright.dev/docs/test-webserver)

## Dev Agent Record

### Agent Model Used
_(to be filled by implementing agent)_

### Implementation Plan
_(to be filled by implementing agent)_

### Completion Notes
_(to be filled by implementing agent)_

### File List
- `.github/workflows/ci.yml` (update)
- `playwright.config.ts` (update — AC 2)
- `src/middleware.test.ts` (update — AC 3)
- `package.json` (if adding `type-check` or `start` scripts missing)
- `vercel.json` (if custom config needed)

### Review Findings
_(to be filled by reviewer)_

### Change Log
_(to be filled by implementing agent)_
