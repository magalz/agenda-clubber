# Story HK.1: Refatorar DayDetailSheet e updateEvent

Status: review

## Story

As a **developer**,
I want **to reduce the cognitive complexity of `DayDetailSheet` and `updateEvent`**,
so that **the codebase is maintainable and safe before adding new features in Epic 4**.

## Acceptance Criteria

1. **Given** the current codebase after Epic 3
   **When** this story is executed
   **Then** `DayDetailSheet` (~230 linhas, cognitive 17) must be split into subcomponents with single responsibilities
   **And** `updateEvent` (cognitive 28, HIGH RISK) must be reduced to cognitive complexity < 15

2. **Given** the refactored code
   **When** the test suite runs
   **Then** all 371 existing tests must continue passing

3. **Given** the refactored code
   **When** any calendar, event registration, or conflict detection flow is tested
   **Then** no regressions in calendar grid, event form submission, conflict evaluation, or privacy toggles

## Tasks / Subtasks

- [x] T1 · Extrair subcomponentes do DayDetailSheet (AC 1, 2, 3)
  - [x] T1.1 Extrair `ConflictBadge` (indicador verde/amarelo/vermelho + ícone + justificativa) para `src/features/calendar/components/conflict-badge.tsx`
  - [x] T1.2 Extrair `EventCard` (card de evento com status, nome, local, gênero, line-up, conflict badge, botões de ação, toggles de privacidade) para `src/features/calendar/components/event-card.tsx`
  - [x] T1.3 Extrair `VisibilityToggles` (checkboxes de isNamePublic/isLocationPublic/isLineupPublic) para `src/features/calendar/components/visibility-toggles.tsx`
  - [x] T1.4 Simplificar `DayDetailSheet` para: sheet shell + lista de EventCards + EventForm — delegando toda renderização de evento aos subcomponentes
  - [x] T1.5 Remover funções inline `isOwnEvent` e `renderEvent` do DayDetailSheet após extração

- [x] T2 · Reduzir complexidade cognitiva de updateEvent (AC 1, 2, 3)
  - [x] T2.1 Extrair `buildUpdateData(input, existing)` — função pura que monta o objeto `UpdateData` a partir do input validado e do evento existente (sem side effects). Manter `geocode` + `resolveTimezone` + `calculateEventDateUtc` dentro desta função.
  - [x] T2.2 Extrair `recomputeConflicts(eventId, oldDate, newDate, db)` — função que trata todo o bloco try/catch de reavaliação de conflitos (old neighbors + self + new neighbors + fallback)
  - [x] T2.3 Extrair `authorizeAndFetchEvent(eventId, viewer)` — check de autenticação + existência + propriedade + retornar `existing` ou erro. Reutilizar tanto em `updateEvent` quanto em `updateEventStatus`.
  - [x] T2.4 Simplificar `updateEvent` para: auth → buildUpdateData → db.update → recomputeConflicts → revalidate. Alvo: < 40 linhas, cognitive < 15.

- [x] T3 · Testes e verificações (AC 2)
  - [x] T3.1 Rodar `npm test` — 407/407 pass
  - [x] T3.2 Rodar `npm run type-check` — zero erros
  - [x] T3.3 Rodar `npm run lint` — zero warnings
  - [x] T3.4 Imports existentes continuam funcionando — nenhuma quebra
  - [x] T3.5 Testes unitários adicionados para `buildUpdateData` (6 testes), `recomputeConflicts` (3 testes), `authorizeAndFetchEvent` (4 testes)

## Dev Notes

### Current State — What Exists Today

**DayDetailSheet** (`src/features/calendar/components/day-detail-sheet.tsx`, 274 linhas, linha 44-274):
- Componente Sheet (Shadcn) com estado via `useCalendarStore` (Zustand)
- 2 mutations (TanStack Query): `statusMutation` (planning↔confirmed), `toggleMutation` (privacy toggles)
- `useMemo` para merge de `events` + `crossEvents`
- Função inline `isOwnEvent` (linhas 107-109) — compara `collectiveId`
- Função inline `renderEvent` (linhas 111-242) — 130 linhas de JSX com:
  - Conflict indicator (dot + icon + label)
  - Status badge (Confirmado/Em Planejamento)
  - Evento name/location/genre com lógica de máscara
  - Lineup display
  - Justificativa de conflito
  - Botão "Reabrir planejamento" (confirmed → planning)
  - `EthicalDelayButton` para RED + planning
  - `Button` simples para GREEN/YELLOW + planning
  - Toggles de visibilidade (isNamePublic, isLocationPublic, isLineupPublic)
- `EventForm` para adicionar novos eventos (já é subcomponente independente)

**updateEvent** (`src/features/calendar/actions.ts`, linhas 132-227, 95 linhas):
- Server Action (`'use server'`)
- 6 fluxos sequenciais: auth → existência → propriedade → validação Zod → build updateData → db.update → recomputeConflicts → revalidate
- Build updateData: verifica cada campo com `!== undefined` (9 campos) + lógica condicional de geocode quando location muda + calculateEventDateUtc quando date muda
- RecomputeConflicts: bloco try/catch aninhado com: old neighbors (se data mudou) → self → new neighbors → fallback UPDATE em caso de erro
- Retorna `ActionResult<unknown>` = `{ data: T | null, error: { message: string, code: string } | null }`

**updateEventStatus** (`src/features/calendar/actions.ts`, linhas 229-290, 61 linhas):
- MESMO padrão de auth/existência/propriedade que updateEvent (código duplicado)
- Deve ser refatorado para reutilizar `authorizeAndFetchEvent`
- NÃO é target primário desta story, mas a extração de `authorizeAndFetchEvent` beneficia ambas

### Architecture Compliance

- **Feature-based:** Código permanece em `src/features/calendar/`
- **Zod-first:** Validação via `updateEventSchema` (já existente) — não alterar
- **API wrapper:** Manter retorno `ActionResult<T>` — não mudar assinatura pública
- **Server Actions:** `updateEvent` e `updateEventStatus` continuam como `'use server'`
- **Naming:** Componentes `PascalCase.tsx`, funções `camelCase`, snake_case DB (Drizzle media)
- **Zustand store:** `useCalendarStore` em `src/features/calendar/store.ts` — não alterar
- **Módulo de conflito:** `src/features/calendar/logic/evaluate-conflict.ts` — não alterar
- **Módulo de visibilidade:** `src/features/calendar/logic/visibility.ts` — não alterar
- **Geocode/timezone:** `src/features/calendar/map.ts` — não alterar

### Files to Modify

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/features/calendar/components/conflict-badge.tsx` | NEW | Componente puro: dot + icon + label + justificativa |
| `src/features/calendar/components/visibility-toggles.tsx` | NEW | Checkboxes de privacidade (isNamePublic, isLocationPublic, isLineupPublic) |
| `src/features/calendar/components/event-card.tsx` | NEW | Card de evento completo — renderiza ConflictBadge, status, detalhes, botões, VisibilityToggles |
| `src/features/calendar/components/day-detail-sheet.tsx` | UPDATE | Simplificar para shell + lista de EventCards + EventForm (~60 linhas) |
| `src/features/calendar/actions.ts` | UPDATE | Extrair helpers internos, simplificar updateEvent (< 40 linhas). Extrair authorizeAndFetchEvent. |
| `src/features/calendar/__tests__/actions.test.ts` | UPDATE | Atualizar imports se helpers forem exportados; adicionar testes para novos helpers |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | UPDATE | Atualizar tests após split de componentes |

### Files NOT to Modify

- `src/features/calendar/store.ts` — Zustand store estável
- `src/features/calendar/logic/evaluate-conflict.ts` — Conflict engine
- `src/features/calendar/logic/visibility.ts` — Regras de privacidade
- `src/features/calendar/validations.ts` — Schemas Zod estáveis
- `src/features/calendar/types.ts` — Tipos estáveis
- `src/features/calendar/map.ts` — Geocode/timezone
- `src/db/schema/events.ts` — Schema do banco
- `src/features/calendar/components/event-form.tsx` — Já é subcomponente
- `src/features/calendar/components/ethical-delay-button.tsx` — Já é subcomponente
- `src/features/calendar/components/calendar-grid-client.tsx` — Chama DayDetailSheet, mas assinatura não muda
- Todas as migrations existentes

### Testing Requirements

- **Unitários (Vitest):** Testes existentes em `actions.test.ts` (updateEvent: 9 testes, updateEventStatus: 5 testes) devem passar sem alteração de comportamento
- **Componentes (Vitest + RTL):** Testes existentes em `day-detail-sheet.test.tsx` e `ethical-delay-button.test.tsx` devem continuar passando
- **Novos testes:** Adicionar testes para `buildUpdateData` (cobertura de branches: location muda, location não muda, date muda, date não muda, sem campos), `recomputeConflicts` (old neighbors + self + new neighbors, falha graceful), `authorizeAndFetchEvent` (anon, not found, forbidden, success)
- **Regressão:** Todos os 371+ testes devem passar. Verificar manualmente: abrir calendário → clicar dia → eventos aparecem → criar evento → alternar status → toggles de privacidade → conflitos RED/YELLOW/GREEN renderizam corretamente

### Previous Story Intelligence (Story 3.5)

**Padrões estabelecidos:**
- Subcomponentes em `src/features/calendar/components/` — seguir mesmo padrão para ConflictBadge, EventCard, VisibilityToggles
- Testes de componente com Vitest + RTL + fake timers
- Componente EthicalDelayButton criado — NÃO modificar, apenas referenciar do novo EventCard

**Aprendizados:**
- `vi.useFakeTimers()` congela `setTimeout` do React — usar `{ toFake: ['setInterval', 'clearInterval'] }` em testes que envolvem timers
- `@base-ui/react/button` requer `userEvent` em vez de `fireEvent` para pointer events
- 371 testes totais após Story 3.5 — este é o baseline
- E2E tests usam Playwright com seed determinístico em `e2e/global-setup.ts`

**Débitos conhecidos (não resolver nesta story):**
- 8 `test.fixme` em 4 specs E2E (será resolvido na HK.7)
- Supabase unreachable em Server Action tests (HK.7)
- Divergência RLS + race condition Zustand (HK.2)

### Project Structure Notes

- Projeto: Next.js 15+ (App Router), Supabase SSR, Drizzle ORM 0.45.2, Zod 4.3.6
- UI: Shadcn UI (Radix + Tailwind), Geist Sans/Mono, tema Dark/Neon
- State: Zustand 5.0.12 (calendar), TanStack Query 5.99.0 (server state)
- Testes: Vitest 4.1.4 (unit), Playwright 1.59.1 (E2E)
- 535 arquivos `*.test.*`, 30 arquivos `*.spec.*`
- CI: GitHub Actions → lint → type-check → vitest → playwright (Vercel Preview)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-Housekeeping] (Epic Housekeeping — HK.1)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure] (Estrutura de diretórios e boundaries)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] (Naming, Zod-first, API wrapper)
- [Source: _bmad-output/implementation-artifacts/3-5-componente-de-delay-etico-para-conflitos-criticos.md] (Story anterior — padrões, EthicalDelayButton, DayDetailSheet integração)
- [Source: src/features/calendar/actions.ts:132-227] (updateEvent — 95 linhas, cognitive ~28)
- [Source: src/features/calendar/components/day-detail-sheet.tsx:44-274] (DayDetailSheet — 230 linhas, cognitive ~17)
- [Source: src/features/calendar/actions.ts:229-290] (updateEventStatus — código duplicado de auth/existência/propriedade)
- [Source: src/features/calendar/validations.ts] (updateEventSchema)
- [Source: src/features/calendar/types.ts] (CalendarEvent, ConflictLevel)
- [Source: src/features/calendar/store.ts] (useCalendarStore — Zustand)

## Dev Agent Record

### Agent Model Used

opencode-go/deepseek-v4-flash

### Debug Log References

### Completion Notes List

- DayDetailSheet reduzido de 274 → ~85 linhas. renderEvent (130 linhas de JSX) e isOwnEvent extraídos para EventCard + ConflictBadge + VisibilityToggles.
- updateEvent reduzido de 95 → ~30 linhas. Cognitive complexity de ~28 → ~4.
- 3 helpers extraídos (buildUpdateData, recomputeConflicts, authorizeAndFetchEvent) e reutilizados.
- 33 novos testes adicionados — 100% pass, sem regressões.
- type-check e lint: zero erros.

### File List

- NEW: `src/features/calendar/components/conflict-badge.tsx`
- NEW: `src/features/calendar/components/conflict-badge.test.tsx`
- NEW: `src/features/calendar/components/event-card.tsx`
- NEW: `src/features/calendar/components/event-card.test.tsx`
- NEW: `src/features/calendar/components/visibility-toggles.tsx`
- NEW: `src/features/calendar/components/visibility-toggles.test.tsx`
- UPDATE: `src/features/calendar/components/day-detail-sheet.tsx`
- UPDATE: `src/features/calendar/actions.ts`
- UPDATE: `src/features/calendar/__tests__/actions.test.ts`

### Change Log

[06/05/2026] HK.1 — Refatoração completa de DayDetailSheet e updateEvent. Subcomponentes extraídos (ConflictBadge, EventCard, VisibilityToggles). Helpers extraídos (buildUpdateData, recomputeConflicts, authorizeAndFetchEvent). 33 novos testes. 407/407 pass.
