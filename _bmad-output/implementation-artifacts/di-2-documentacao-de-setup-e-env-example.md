# Story DI.2: Documentação de Setup e Arquivo `.env.example`

Status: done

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

- [x] **Inventory Active Env Vars (AC: 1-4)**
  - [x] Grep codebase for `process.env.*` references
  - [x] Cross-check with `src/lib/sentry.ts` and Supabase client initialization
  - [x] List all active variables and classify: required vs optional vs future
- [x] **Create `.env.example` (AC: 1-4, 8)**
  - [x] Write file at project root with grouped sections: `# Supabase`, `# Database (Drizzle)`, `# Sentry`, `# Future: Upstash QStash`, `# Future: Evolution API`
  - [x] Add inline comment for each variable explaining purpose and source (e.g., `# Supabase project URL - get from https://supabase.com/dashboard/project/{ref}/settings/api`)
  - [x] Use clear placeholder values (never real secrets)
- [x] **Update README (AC: 5)**
  - [x] Add `## Local Setup` section after the project intro
  - [x] Document the exact command sequence: `git clone` → `cp .env.example .env.local` → edit values → `npm install` → `npm run dev`
  - [x] Add note about needing a Supabase project created beforehand
- [x] **Document Commit Conventions (AC: 6)**
  - [x] Add `## Commit Conventions` section with Conventional Commits table
  - [x] Include at least one concrete example per type taken from real history (e.g., `fix(story-1-4): corrigir violações de AC...`)
- [x] **Document Worktree Workflow (AC: 7)**
  - [x] Add `## Development Workflow` or `## Worktree Workflow` section
  - [x] Document the full lifecycle including the `.claude/worktrees/` convention
  - [x] Link to related BMAD docs in `_bmad-output/` for story file conventions
- [x] **Security Review (AC: 8)**
  - [x] `git diff` review: confirm no `.env.local` content leaked
  - [x] Confirm `.gitignore` includes `.env.local` (should already)

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
claude-sonnet-4-6

### Implementation Plan
1. Grep `src/` para todos os `process.env.*` em uso no projeto.
2. Verificar `src/lib/sentry.ts` — stub comentado, usa `NEXT_PUBLIC_SENTRY_DSN`.
3. Reescrever `.env.example` com seções agrupadas e placeholders seguros.
4. Substituir README.md genérico (boilerplate Next.js+Supabase) por README específico do projeto com seções: Local Setup, Commit Conventions, Worktree Workflow.
5. Security review: confirmar apenas placeholders no `.env.example` e que `.env*.local` está no `.gitignore`.

### Completion Notes
- `.env.example` reescrito com 6 seções: Supabase (3 vars), Database/Drizzle (1), Application (1), Sentry (4 — comentadas por padrão), QStash (3 comentadas), Evolution API (2 comentadas).
- `README.md` substituído: removido boilerplate do Supabase Starter Kit, adicionado Local Setup (6 passos, incluindo migrations), Pré-requisitos (Node.js >= 18.18), tabela de Commit Conventions, Development Workflow com worktrees.
- `.gitignore` já incluía `.env*.local` — nenhuma alteração necessária.
- Nenhum segredo real incluído — apenas placeholders como `your-project-ref.supabase.co` e `<your-anon-key>`.
- A variável `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` é o nome real usado no código; comentário no `.env.example` esclarece a equivalência com `NEXT_PUBLIC_SUPABASE_ANON_KEY` (AC 2 satisfeito).
- **Pós-revisão (Gemini, 2026-04-20):** aplicados 5 fixes baseados em revisão adversarial por 3 revisores independentes — veja Review Findings.

### File List
- `.env.example`
- `README.md`

### Review Findings

Revisão adversarial realizada por 3 agentes Gemini independentes (2026-04-20).
**Acceptance Auditor:** 8/8 PASS — DI.2 APROVADA nos ACs.
**Blind Test:** APROVAR — qualidade geral excelente; 3 ressalvas Low.
**Edge Case Hunter:** 1 High, 3 Med, 2 Low — todos triagados abaixo.

Findings aplicados como fixes nesta sessão:

| Severidade | Finding | Resolução |
|-----------|---------|-----------|
| High | Falta passo de migrations no Local Setup — dev com banco vazio travaria no primeiro `npm run dev` | Adicionado passo 5 (`npx drizzle-kit push`) com aviso sobre Direct URL |
| Med | `DATABASE_URL` apontava para Transaction Pooler (porta 6543) — incompatível com migrations Drizzle | Trocado para Direct URL (porta 5432) + comentário explicando ambas as opções |
| Med | Vars do Sentry descomentadas com placeholders inválidos — potencial crash/warning no boot | Commentadas por padrão; nota sobre DI.4 e contexto CI/CD |
| Med | `git branch -d` falha após squash merge no GitHub | Trocado para `git branch -D` |
| Low | Node.js version não documentada | Adicionado bloco de Pré-requisitos no Local Setup |

Findings descartados (DISMISS):

| Severidade | Finding | Motivo |
|-----------|---------|--------|
| Low | Fallback `localhost:54322` silencioso no código | Comportamento de código, não da doc; sem ação necessária |
| Low | Inconsistência PT/EN entre README e `.env.example` | `.env.example` em inglês é padrão da indústria; README em PT é intencional |

### Change Log
- 2026-04-20: Reescrita completa de `.env.example` com todas as variáveis ativas e futuras documentadas (AC 1–4, 8).
- 2026-04-20: README.md substituído por documentação específica do projeto: Local Setup, Commit Conventions, Worktree Workflow (AC 5–7).
- 2026-04-20: Pós-revisão adversarial — 5 fixes aplicados: passo de migrations, DATABASE_URL para direct URL, Sentry vars comentadas, git branch -D, Node.js version.
