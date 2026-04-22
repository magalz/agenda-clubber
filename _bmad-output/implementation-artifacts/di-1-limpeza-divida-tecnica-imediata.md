# Story DI.1: Limpeza de Dívida Técnica Imediata

Status: ready-for-dev

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

- [x] **Create `src/lib/routes.ts` (AC: 1, 5)**
  - [x] Define `export const ROUTES = { home: '/', login: '/auth/login', signup: '/auth/sign-up', onboardingArtist: '/onboarding/artist', onboardingProducer: '/onboarding/producer', dashboard: '/dashboard', admin: '/admin', authPrefix: '/auth' } as const;`
  - [x] Export a `Route` type derived from `typeof ROUTES[keyof typeof ROUTES]` for type-safe navigation
  - [x] Replace hard-coded route strings in `src/middleware.ts`, redirects, and `Link`s with `ROUTES.*`
- [x] **Relocate Auth Components (AC: 2, 5)**
  - [x] Create directory `src/features/auth/components/` if it does not exist
  - [x] Move `src/components/login-form.tsx` → `src/features/auth/components/login-form.tsx` (use `git mv` to preserve history)
  - [x] Move `src/components/nav-user.tsx` → `src/features/auth/components/nav-user.tsx`
  - [x] Update all import paths via project-wide grep (`@/components/login-form` → `@/features/auth/components/login-form` e análogo para `nav-user`)
- [x] **Fix Story 1.1 Status (AC: 3)**
  - [x] Edit `_bmad-output/implementation-artifacts/1-1-cadastro-inicial-e-triagem-de-papel.md`: change `Status: review` to `Status: done`
- [x] **Verify Non-Regression (AC: 4)**
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
  - [x] Run `npm run test` (Vitest)
  - [x] Run `npm run test:e2e` (Playwright, if viable locally)

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
claude-sonnet-4-6

### Implementation Plan
1. Criar `src/lib/routes.ts` com constante `ROUTES` e tipo `Route`.
2. Mover `login-form.tsx` e `nav-user.tsx` para `src/features/auth/components/` via `git mv`.
3. Atualizar todos os imports afetados (`@/components/login-form` → `@/features/auth/components/login-form`, idem `nav-user`).
4. Substituir strings hardcoded de rota em `src/middleware.ts` e `src/features/auth/actions.ts` por `ROUTES.*`.
5. Corrigir `status: review → done` no arquivo da story 1.1.
6. Revisão adversarial Gemini (3 revisores): edge-case-hunter, blind-test, acceptance-auditor.

### Completion Notes
- `ROUTES` criado com 7 rotas + `authPrefix: '/auth'` — o `startsWith` hardcoded no middleware precisava de `authPrefix` como constante extra.
- Pós-review Gemini: valores de rota corrigidos para bater com a estrutura real de rotas Next.js do projeto (`login: '/auth/login'`, `signup: '/auth/sign-up'`).
- Todos os imports atualizados. Build, lint e testes passando.

### File List
- `src/lib/routes.ts` (criado)
- `src/features/auth/components/login-form.tsx` (movido de `src/components/`)
- `src/features/auth/components/nav-user.tsx` (movido de `src/components/`)
- `src/middleware.ts` (atualizado — usa `ROUTES.*`)
- `src/features/auth/actions.ts` (atualizado — usa `ROUTES.*`)
- `src/app/auth/login/page.tsx` (atualizado — import corrigido)
- `_bmad-output/implementation-artifacts/1-1-cadastro-inicial-e-triagem-de-papel.md` (status: review → done)
- `_bmad-output/implementation-artifacts/di-1-gemini-review-prompts.md` (criado — prompts de revisão LLM)

### Review Findings
Revisão adversarial Gemini (3 revisores) — 2026-04-20.
- Rotas `login` e `signup` apontavam para `/login` e `/signup` mas o projeto usa `/auth/login` e `/auth/sign-up` — corrigido.
- `authPrefix` ausente no `ROUTES` inicial — adicionado para substituir o último `startsWith` hardcoded no middleware.

### Change Log
- 2026-04-20: Implementação completa — `routes.ts` criado, componentes movidos, imports atualizados, middleware refatorado, status 1.1 corrigido.
- 2026-04-20: Pós-review Gemini — valores de rota corrigidos para bater com estrutura real do projeto.
