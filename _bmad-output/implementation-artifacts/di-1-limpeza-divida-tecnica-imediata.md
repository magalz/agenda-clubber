# Story DI.1: Limpeza de Dívida Técnica Imediata

Status: done

## Story

As a developer,
I want the immediate technical debt from Epic 1 resolved,
so that the codebase is clean before adding DevOps automation on top of it.

## Acceptance Criteria

1. **Routes Module (Action Item #1):** `src/lib/routes.ts` exists and exports typed route constants for all current routes: `/`, `/login`, `/signup`, `/onboarding/artist`, `/onboarding/producer`, `/dashboard`, `/admin`.
2. **Auth Components Relocation (Action Item #2):**
    - `src/components/login-form.tsx` moved to `src/features/auth/components/login-form.tsx`.
    - `src/components/nav-user.tsx` moved to `src/features/auth/components/nav-user.tsx`.
    - All imports across the codebase updated to the new paths.
3. **Story 1.1 Status Correction (Action Item #4):** The `status` field in `_bmad-output/implementation-artifacts/1-1-cadastro-inicial-e-triagem-de-papel.md` corrected from `review` to `done`.
4. **Non-Regression:** `npm run build`, `npm run lint`, `npm run test` all pass after the refactoring. No behavioral change in the app.
5. **Import Consistency:** All refactored code uses the `@/` alias and references the new `routes.ts` constants instead of hard-coded strings wherever routes appear.

## Tasks / Subtasks

- [ ] **Create `src/lib/routes.ts` (AC: 1, 5)**
  - [ ] Define `export const ROUTES = { home: '/', login: '/login', signup: '/signup', onboardingArtist: '/onboarding/artist', onboardingProducer: '/onboarding/producer', dashboard: '/dashboard', admin: '/admin' } as const;`
  - [ ] Export a `Route` type derived from `typeof ROUTES[keyof typeof ROUTES]` for type-safe navigation
  - [ ] Replace hard-coded route strings in `src/middleware.ts`, redirects, and `Link`s with `ROUTES.*`
- [ ] **Relocate Auth Components (AC: 2, 5)**
  - [ ] Create directory `src/features/auth/components/` if it does not exist
  - [ ] Move `src/components/login-form.tsx` → `src/features/auth/components/login-form.tsx` (use `git mv` to preserve history)
  - [ ] Move `src/components/nav-user.tsx` → `src/features/auth/components/nav-user.tsx`
  - [ ] Update all import paths via project-wide grep (`@/components/login-form` → `@/features/auth/components/login-form` e análogo para `nav-user`)
- [ ] **Fix Story 1.1 Status (AC: 3)**
  - [ ] Edit `_bmad-output/implementation-artifacts/1-1-cadastro-inicial-e-triagem-de-papel.md`: change `Status: review` to `Status: done`
- [ ] **Verify Non-Regression (AC: 4)**
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`
  - [ ] Run `npm run test` (Vitest)
  - [ ] Run `npm run test:e2e` (Playwright, if viable locally)

## Dev Notes

- **Origin:** This story consolidates 3 of the 4 immediate action items from the Epic 1 retrospective (17/04/2026). Action item #3 (`.env.example`) is handled in Story DI.2.
- **Rationale for ordering:** This must land before any CI/CD work so that GitHub Actions runs against a clean tree.
- **No dependency contracts change.** This is pure refactoring — no DB, no API, no UX change.
- **Prefer `git mv` over delete+create** to preserve file history through the move.

### Project Structure Notes

- `src/features/auth/components/` is the canonical location for auth-related UI per `architecture.md` (feature-based organization).
- `src/lib/routes.ts` pattern enables safe route renaming in future epics — Epic 2 will need to add `/artists/:slug` and similar.

### References

- [Epic 1 Retrospective](_bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md) — Action Items #1, #2, #4
- [Epics - DevOps/Infra](_bmad-output/planning-artifacts/epics.md#epic-devops-infra-governanca-de-ambiente-e-pipeline-de-qualidade)
- [Architecture - Feature Organization](_bmad-output/planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used
_(to be filled by implementing agent)_

### Implementation Plan
_(to be filled by implementing agent)_

### Completion Notes
_(to be filled by implementing agent)_

### File List
_(to be filled by implementing agent)_

### Review Findings
_(to be filled by reviewer)_

### Change Log
_(to be filled by implementing agent)_
