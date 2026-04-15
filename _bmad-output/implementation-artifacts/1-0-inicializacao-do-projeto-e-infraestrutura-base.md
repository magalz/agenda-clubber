# Story 1.0: Inicialização do Projeto e Infraestrutura Base

Status: ready-for-dev

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

- [ ] **Project Setup (AC: 1, 4)**
  - [ ] Run `npx create-next-app -e with-supabase agenda-clubber`
  - [ ] Configure `.env.local` with Supabase credentials
- [ ] **Database Layer (AC: 2)**
  - [ ] Install `drizzle-orm`, `drizzle-kit`, `postgres`
  - [ ] Configure `drizzle.config.ts` and `src/db/index.ts`
  - [ ] Create initial `profiles` and `collectives` schemas (snake_case in DB, camelCase in code)
- [ ] **UI & Styling (AC: 3)**
  - [ ] Initialize Shadcn UI: `npx shadcn-ui@latest init`
  - [ ] Configure `tailwind.config.ts` with Neon palette and Geist fonts
  - [ ] Implement `src/app/globals.css` with 1px border defaults
- [ ] **Testing & Observability (AC: 5)**
  - [ ] Install and configure Vitest
  - [ ] Install and configure Playwright with base E2E test
  - [ ] Initialize Sentry using `@sentry/nextjs`
- [ ] **Quality Guardrails (TEA Requirement)**
  - [ ] Create `src/lib/test-utils/seeding.ts` stub for future Seeding APIs
  - [ ] Setup base MSW (Mock Service Worker) for external API mocking (WhatsApp/Maps)

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
Gemini 2.0 Flash (Experimental)

### File List
- `drizzle.config.ts`
- `tailwind.config.ts`
- `src/db/index.ts`
- `src/db/schema/`
- `src/lib/sentry.ts`
- `src/lib/test-utils/seeding.ts`
- `middleware.ts`
