# Story 1.0: Inicialização do Projeto e Infraestrutura Base

Status: done

## Story

As a developer,
I want to initialize the project with the official Supabase starter and core libraries,
so that I have a solid, standardized foundation for all subsequent features.

## Acceptance Criteria

1. **Initialization:** Project scaffolded using `npx create-next-app -e with-supabase agenda-clubber` with Next.js 15+ and Supabase SSR.
2. **Database & ORM:** Drizzle ORM (v0.45.2) configured to connect to Supabase PostgreSQL with `drizzle-kit` for migrations.
3. **UI & Design Tokens:** 
    - Tailwind CSS configured with `Geist Sans` and `Geist Mono` typography.
    - Custom colors implemented in `tailwind.config.ts` (Pure Black base, Neon Red `#FF0000`, Neon Green, Neon Yellow).
    - Shadcn UI initialized and basic theme set to Dark.
4. **Environment:** `.env.local` synchronized with Supabase project credentials (URL, Anon Key, Service Role Key).
5. **Quality & Testing:** 
    - Vitest (v4.1.4) and Playwright (v1.59.1) initialized.
    - Sentry (lib/sentry.ts) stubbed for monitoring.
    - CI/CD scaffold with GitHub Actions for linting and testing.
6. **Architecture Compliance:** Project structure follows the feature-based organization defined in `architecture.md`.

## Tasks / Subtasks

- [x] **Project Setup (AC: 1, 4)**
  - [x] Run `npx create-next-app -e with-supabase agenda-clubber`
  - [x] Configure `.env.local` with Supabase credentials
- [x] **Database Layer (AC: 2)**
  - [x] Install `drizzle-orm`, `drizzle-kit`, `postgres`
  - [x] Configure `drizzle.config.ts` and `src/db/index.ts`
  - [x] Create initial `profiles` and `collectives` schemas (snake_case in DB, camelCase in code)
- [x] **UI & Styling (AC: 3)**
  - [x] Initialize Shadcn UI: `npx shadcn-ui@latest init`
  - [x] Configure `tailwind.config.ts` with Neon palette and Geist fonts
  - [x] Implement `src/app/globals.css` with 1px border defaults
- [x] **Testing & Observability (AC: 5)**
  - [x] Install and configure Vitest
  - [x] Install and configure Playwright with base E2E test
  - [x] Initialize Sentry using `@sentry/nextjs`
- [x] **Quality Guardrails (TEA Requirement)**
  - [x] Create `src/lib/test-utils/seeding.ts` stub for future Seeding APIs
  - [x] Setup base MSW (Mock Service Worker) for external API mocking (WhatsApp/Maps)

## Dev Notes

- **Architecture:** Follow the Feature-based organization: `src/features/{auth,artists,calendar}`. [Source: architecture.md#Complete-Project-Directory-Structure]
- **Naming:** Database tables must be **plural** and `snake_case`. Drizzle must map to `camelCase`. [Source: architecture.md#Naming-Patterns]
- **Security:** RLS must be enabled on all new tables. [Source: agenda-clubber-handoff.md#Quality-Gates]
- **Design:** Aesthetics "Line-over-Black" with 1px borders. [Source: epics.md#UX-Design-Requirements]

### Project Structure Notes

- Use `@/` alias for all absolute imports.
- Keep domain logic in `src/features/`.
- UI components in `src/components/ui/` (Shadcn) should remain "dumb".

### References

- [PRD - Scope & NFRs](_bmad-output/planning-artifacts/prd.md)
- [Architecture - Tech Stack & Patterns](_bmad-output/planning-artifacts/architecture.md)
- [TEA Handoff - Quality Gates & Risks](_bmad-output/test-artifacts/test-design/agenda-clubber-handoff.md)

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Implementation Plan
- Scaffolded Next.js 15 with Supabase SSR template
- Configured Drizzle ORM v0.45.2 with profiles and collectives schemas
- Initialized shadcn UI with dark theme defaults
- Set up Tailwind with Neon Red/Green/Yellow palette and Geist fonts
- Configured Vitest for unit tests and Playwright for E2E
- Created Sentry, MSW, and seeding stubs
- Created GitHub Actions CI/CD workflow

### Completion Notes
- ✅ All 4 unit tests pass (2 schema, 2 sentry)
- ✅ Dark theme with Line-over-Black aesthetic configured
- ✅ Feature-based directory structure created (src/features/)
- ✅ CI/CD scaffold at .github/workflows/ci.yml

### File List
- `drizzle.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/db/index.ts`
- `src/db/schema/profiles.ts`
- `src/db/schema/collectives.ts`
- `src/db/schema/schema.test.ts`
- `src/lib/sentry.ts`
- `src/lib/sentry.test.ts`
- `src/lib/test-utils/seeding.ts`
- `src/lib/test-utils/msw.ts`
- `e2e/home.spec.ts`
- `.github/workflows/ci.yml`

### Review Findings

- [x] [Review][Patch] Schema glob inclui arquivos `.test.ts` [`drizzle.config.ts:4`]
- [x] [Review][Patch] `playwright.config.ts` sem `webServer` — E2E falha no CI [`playwright.config.ts`]
- [x] [Review][Patch] Playwright não executa na CI [`/.github/workflows/ci.yml`]
- [x] [Review][Patch] Build (`npm run build`) ausente na CI [`/.github/workflows/ci.yml`]
- [x] [Review][Patch] `collectives.status` sem enum/constraint [`src/db/schema/collectives.ts:13`]
- [x] [Review][Patch] `collectives.ownerId` sem `onDelete` — FK bloqueia deleção [`src/db/schema/collectives.ts:14`]
- [x] [Review][Patch] `collectives.updatedAt` sem `$onUpdateFn` [`src/db/schema/collectives.ts:16`]
- [x] [Review][Patch] E2E regex permissiva — falso positivo no título [`e2e/home.spec.ts:5`]
- [x] [Review][Defer] RLS ausente em `collectives` [`src/db/schema/collectives.ts`] — deferred, pertence à Story 1.4
- [x] [Review][Defer] `src/features/` não aparece no diff — verificar manualmente — deferred, pre-existing
- [x] [Review][Defer] Versões de dependências não verificáveis pelo diff — deferred, limitação de auditoria
- [x] [Review][Defer] `.env.example` ausente — deferred, fora do escopo da AC 4

### Change Log
- 2026-04-15: Full project initialization from scratch - all tasks completed
- 2026-04-16: Code review realizado (Gemini). 8 patches identificados, 4 deferred.
