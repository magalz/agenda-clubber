# Story DI.2: Documentação de Setup e Arquivo `.env.example`

Status: ready-for-dev

## Story

As a developer (human or agent) joining the project,
I want a complete environment configuration reference and setup documentation,
so that I can set up a working local environment without guessing or reading source code.

## Acceptance Criteria

1. **`.env.example` at Root (Action Item #3):** A `.env.example` file exists at the project root listing ALL required environment variables with inline comments explaining each variable's purpose and where to obtain it.
2. **Supabase Variables Coverage:** `.env.example` includes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` (for Drizzle).
3. **Observability Variables:** `.env.example` includes `SENTRY_DSN` and any other Sentry variables currently used (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` if present in `lib/sentry.ts`).
4. **Future Integrations (Stub):** `.env.example` includes placeholder entries (commented) for upcoming integrations defined in architecture: Upstash QStash (`QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`) and Evolution API (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`).
5. **Setup Section in README:** `README.md` (or new `CONTRIBUTING.md`) includes a "Local Setup" section with ordered steps: clone repo → `cp .env.example .env.local` → fill values from Supabase dashboard → `npm install` → `npm run dev`.
6. **Commit Conventions Documented:** The documentation includes a section on Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `style:`) with one-line examples of each.
7. **Worktree Workflow Documented:** The documentation includes the Claude Code worktree workflow: create worktree (`/worktree` or equivalent) → implement story in isolation → PR review → merge to `main` → delete worktree.
8. **No Secrets Leaked:** `.env.example` contains NO real credentials — only placeholders like `your-project-ref.supabase.co` or `<your-anon-key>`.

## Tasks / Subtasks

- [ ] **Inventory Active Env Vars (AC: 1-4)**
  - [ ] Grep codebase for `process.env.*` references
  - [ ] Cross-check with `src/lib/sentry.ts` and Supabase client initialization
  - [ ] List all active variables and classify: required vs optional vs future
- [ ] **Create `.env.example` (AC: 1-4, 8)**
  - [ ] Write file at project root with grouped sections: `# Supabase`, `# Database (Drizzle)`, `# Sentry`, `# Future: Upstash QStash`, `# Future: Evolution API`
  - [ ] Add inline comment for each variable explaining purpose and source (e.g., `# Supabase project URL - get from https://supabase.com/dashboard/project/{ref}/settings/api`)
  - [ ] Use clear placeholder values (never real secrets)
- [ ] **Update README (AC: 5)**
  - [ ] Add `## Local Setup` section after the project intro
  - [ ] Document the exact command sequence: `git clone` → `cp .env.example .env.local` → edit values → `npm install` → `npm run dev`
  - [ ] Add note about needing a Supabase project created beforehand
- [ ] **Document Commit Conventions (AC: 6)**
  - [ ] Add `## Commit Conventions` section with Conventional Commits table
  - [ ] Include at least one concrete example per type taken from real history (e.g., `fix(story-1-4): corrigir violações de AC...`)
- [ ] **Document Worktree Workflow (AC: 7)**
  - [ ] Add `## Development Workflow` or `## Worktree Workflow` section
  - [ ] Document the full lifecycle including the `.claude/worktrees/` convention
  - [ ] Link to related BMAD docs in `_bmad-output/` for story file conventions
- [ ] **Security Review (AC: 8)**
  - [ ] `git diff` review: confirm no `.env.local` content leaked
  - [ ] Confirm `.gitignore` includes `.env.local` (should already)

## Dev Notes

- **Origin:** Retrospective Action Item #3 (immediate) + DevOps epic scope item "setup documentation".
- **Do NOT create** `.env.local` in this story — only `.env.example`. The `.gitignore` already excludes `.env.local`.
- **Commented future vars are intentional** — agents implementing Epic 4 (WhatsApp/QStash) will uncomment and populate them. Saves rework.
- **Dependency on DI.1:** none. Can be executed in parallel with DI.1.
- **Reference existing Sentry stub** at `src/lib/sentry.ts` to determine the exact Sentry env var names currently expected.

### References

- [Epic 1 Retrospective](_bmad-output/implementation-artifacts/epic-1-retro-2026-04-17.md) — Action Item #3
- [Epics - DevOps/Infra](_bmad-output/planning-artifacts/epics.md#epic-devops-infra-governanca-de-ambiente-e-pipeline-de-qualidade)
- [Architecture - External Services](_bmad-output/planning-artifacts/architecture.md)
- [Deferred Work Log](_bmad-output/implementation-artifacts/deferred-work.md) — `.env.example` deferred in Story 1.0 review

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
