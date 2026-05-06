# Story HK.2: Corrigir Divergência RLS e Race Condition Zustand

Status: review

## Story

As a **developer**,
I want **to align the RLS policy with the app-layer visibility logic and fix race conditions**,
so that **privacy enforcement is consistent and data integrity is guaranteed**.

## Acceptance Criteria

1. **Given** the `events_select_policy` RLS and app-layer `filterEventForViewer`
   **When** this story is executed
   **Then** RLS must not block rows where `genrePrimary` should be visible per app-layer
   **And** the race condition in Zustand `queryFn` → `setCrossEvents` must be resolved with proper state synchronization

2. **Given** the existing privacy tests
   **When** the test suite runs
   **Then** existing privacy tests must pass without modification

3. **Given** the cross-collective event flow
   **When** loading the calendar
   **Then** cross-collective visibility must work correctly end-to-end (planning events from other collectives appear with masked fields, `genrePrimary` sempre visível)

## Tasks / Subtasks

- [x] T1 · Corrigir divergência RLS — `events_select_policy` (AC 1)
  - [x] T1.1 No arquivo `supabase/migrations/010_events_rls.sql`, remover a condição `AND (is_name_public = true OR is_location_public = true OR is_lineup_public = true)` de planning events — permitir SELECT em qualquer planning event (app-layer já faz masking em `filterEventForViewer`)
  - [x] T1.2 Criar nova migração `supabase/migrations/011_fix_rls_divergence.sql` com a política corrigida (DROP+CREATE)
  - [x] T1.3 Verificar que `filterEventForViewer` em `src/features/calendar/logic/visibility.ts` continua intacta — nenhuma alteração necessária no app-layer

- [x] T2 · Corrigir race condition Zustand — `useCrossCollectiveEvents` (AC 1)
  - [x] T2.1 Em `src/features/calendar/hooks.ts`, remover `setCrossEvents(result)` de dentro do `queryFn` em `useCrossCollectiveEvents`
  - [x] T2.2 Adicionar `useEffect` que sincroniza `data` do TanStack Query → `setCrossEvents` no Zustand, rodando APÓS o commit do cache
  - [x] T2.3 Verificar que `DayDetailSheet` em `day-detail-sheet.tsx` continua fazendo merge correto de `events` + `crossEvents` via `useMemo` (linhas 76-81)

- [x] T3 · Testes e verificações (AC 2, 3)
  - [x] T3.1 Rodar `npm test` — 418 pass (410+ baseline)
  - [x] T3.2 Rodar `npm run type-check` — zero erros (source code; test-results/ pre-existing)
  - [x] T3.3 Rodar `npm run lint` — zero warnings
  - [x] T3.4 Verificar manualmente: abrir calendário → cross-collective events aparecem → `genrePrimary` visível → campos mascarados corretamente → sync entre queries não dessincroniza

## Dev Notes

### Problema D3 — Divergência RLS

**Current RLS** (`supabase/migrations/010_events_rls.sql`):
```sql
CREATE POLICY "events_select_policy" ON events
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR status = 'confirmed'
        OR (status = 'planning' AND (is_name_public = true OR is_location_public = true OR is_lineup_public = true))
    );
```

**Problema:** A cláusula `AND (is_name_public = true OR ...)` impede que eventos planning com TODAS as flags `false` sejam lidos via Supabase JS client. Mas o app-layer `filterEventForViewer` (visibility.ts) sempre preserva `genrePrimary` independente das flags — não existe flag `isGenrePublic`. O RLS bloqueia linhas que o app-layer quer mostrar.

**Contexto:** Drizzle + Server Actions usam `service_role` e bypassam RLS. O RLS existe como defense-in-depth para queries do Supabase JS client. Mas precisa estar alinhado com a lógica do app-layer.

**Fix:** Simplificar para:
```sql
CREATE POLICY "events_select_policy" ON events
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR status = 'confirmed'
        OR status = 'planning'
    );
```
O app-layer (`filterEventForViewer` + `EventCard`) já aplica masking correto (nome → "Em Planejamento", location → "Em Planejamento", lineup → `[]`, mas `genrePrimary` sempre visível).

**NÃO alterar:** `filterEventForViewer` em `src/features/calendar/logic/visibility.ts` — a função está correta. NÃO alterar `EventCard` — o masking visual já funciona.

### Problema D5 — Race Condition queryFn → setCrossEvents

**Current code** (`src/features/calendar/hooks.ts`, `useCrossCollectiveEvents`):
```typescript
export function useCrossCollectiveEvents(dates: Date[]) {
    const setCrossEvents = useCalendarStore((s) => s.setCrossEvents);

    return useQuery({
        queryKey: ['cross-collective-events', dateIsoStrings],
        queryFn: async () => {
            const result = await fetchCrossCollectiveEvents(dateIsoStrings);
            setCrossEvents(result);   // <-- side effect DENTRO do queryFn
            return result;
        },
        staleTime: 30_000,
        enabled: dates.length > 0,
    });
}
```

**Problema:** `setCrossEvents(result)` comita no Zustand DURANTE a execução do `queryFn`, antes do TanStack Query commitar o cache. Isso cria uma janela onde:
- `crossEvents` no Zustand já tem dados novos
- Mas o `data` retornado por `useQuery` ainda é o antigo (query está "loading")
- `DayDetailSheet` faz merge de `events` (Zustand, atualizado via Realtime) + `crossEvents` (Zustand) — se `events` for atualizado via Realtime entre `setCrossEvents` e o commit do TanStack, o merge fica inconsistente

**Fix:** Remover side-effect do `queryFn` e usar `useEffect`:
```typescript
export function useCrossCollectiveEvents(dates: Date[]) {
    const setCrossEvents = useCalendarStore((s) => s.setCrossEvents);

    const query = useQuery({
        queryKey: ['cross-collective-events', dateIsoStrings],
        queryFn: async () => {
            return fetchCrossCollectiveEvents(dateIsoStrings);
        },
        staleTime: 30_000,
        enabled: dates.length > 0,
    });

    useEffect(() => {
        if (query.data) setCrossEvents(query.data);
    }, [query.data, setCrossEvents]);

    return query;
}
```

Isso garante que `crossEvents` no Zustand só é atualizado DEPOIS que o TanStack Query commita o `data`, eliminando a race condition.

### Architecture Compliance

- **Feature-based:** Código em `src/features/calendar/` — sem alteração de estrutura
- **RLS policy:** Defense-in-depth — não é o único mecanismo de segurança, app-layer também filtra
- **Zustand store:** `crossEvents` continua sendo populado — apenas o timing muda (via `useEffect` em vez de dentro do `queryFn`)
- **TanStack Query:** Mantido como fonte primária de dados cross-collective — `data` é o source of truth
- **Naming:** Componentes `PascalCase.tsx`, funções `camelCase`, snake_case DB (Drizzle media)

### Files to Modify

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/010_events_rls.sql` | UPDATE | Remover `AND (is_name_public...)` da `events_select_policy` |
| `supabase/migrations/011_fix_rls_divergence.sql` | NEW | Nova migração com política corrigida |
| `src/features/calendar/hooks.ts` | UPDATE | Remover `setCrossEvents` de `queryFn`, adicionar `useEffect` |

### Files NOT to Modify

- `src/features/calendar/logic/visibility.ts` — `filterEventForViewer` está correta
- `src/features/calendar/logic/visibility.test.ts` — testes existentes devem passar sem alteração
- `src/features/calendar/store.ts` — Zustand store estável, assinatura de `setCrossEvents` não muda
- `src/features/calendar/components/day-detail-sheet.tsx` — merge `useMemo` continua igual
- `src/features/calendar/components/event-card.tsx` — masking visual já funciona
- `src/features/calendar/types.ts` — tipos estáveis
- `src/features/calendar/actions.ts` — Server actions estáveis
- `src/features/calendar/events-queries.ts` — DB queries estáveis
- `src/db/schema/events.ts` — Schema do banco estável
- `supabase/migrations/008_events.sql` — Definição da tabela estável

### Testing Requirements

- **Unitários (Vitest):** 410+ testes existentes devem passar
- **Regressão de privacidade:** Testes em `visibility.test.ts` (201 linhas, 12+ testes) devem passar sem modificação — cobrem owner sees everything, non-owner planning masking, non-owner confirmed full visibility, anon viewer
- **Verificação manual end-to-end:** Abrir calendário → cross-collective events de planning aparecem → `genrePrimary` visível → demais campos mascarados → sync entre queries não dessincroniza ao editar eventos

### Dependencies & Ordering

- **HK.2 é bloco para HK.3 a HK.7** — deve ser concluída antes
- **HK.4 (pipeline CI 2.0)** resolverá seed determinístico — se migração 011 quebrar E2E, ajustar seed
- **HK.7 (test.fixme)** resolverá os 8 E2E skipped — esta story pode expor novos cenários de teste

### Previous Story Intelligence (HK.1)

**Padrões estabelecidos:**
- Server Actions puras em `actions.ts`, helpers sem `'use server'` em `helpers.ts`
- Subcomponentes em `src/features/calendar/components/`
- Testes de componente com Vitest + RTL

**Aprendizados:**
- Sempre usar optional chaining para arrays aninhados (`lineup?.length`)
- 410 testes totais após HK.1 — este é o baseline
- EventCard usa `filterEventForViewer(event, { kind: 'anon' }, false)` para cross-collective — não alterar
- `DayDetailSheet` faz merge `events` + `crossEvents` via `Map` com `useMemo` — entries de `events` sobrescrevem `crossEvents` (owner wins)

**Débitos conhecidos (não resolver nesta story):**
- Dead code (HK.3)
- Pipeline CI v2.0 (HK.4)
- Gate de QA (HK.5)
- GitHub Issues tracking (HK.6)
- 8 test.fixme E2E (HK.7)

### Project Structure Notes

- Projeto: Next.js 15+ (App Router), Supabase SSR, Drizzle ORM 0.45.2, Zod 4.3.6
- UI: Shadcn UI (Radix + Tailwind), Geist Sans/Mono, tema Dark/Neon
- State: Zustand 5.0.12 (calendar), TanStack Query 5.99.0 (server state)
- Testes: Vitest 4.1.4 (unit), Playwright 1.59.1 (E2E)
- CI: GitHub Actions → lint → type-check → vitest → playwright (Vercel Preview)

### References

- [Source: supabase/migrations/010_events_rls.sql] (RLS `events_select_policy` atual — 38 linhas)
- [Source: src/features/calendar/logic/visibility.ts] (`filterEventForViewer` — 32 linhas, sempre preserva genrePrimary)
- [Source: src/features/calendar/logic/visibility.test.ts] (201 linhas, 12+ testes existentes — NÃO modificar)
- [Source: src/features/calendar/hooks.ts:65-82] (`useCrossCollectiveEvents` — race condition em setCrossEvents dentro de queryFn)
- [Source: src/features/calendar/store.ts:22] (`setCrossEvents` no Zustand)
- [Source: src/features/calendar/components/day-detail-sheet.tsx:76-81] (merge events + crossEvents via useMemo)
- [Source: src/features/calendar/components/calendar-grid-client.tsx] (wires useCrossCollectiveEvents)
- [Source: src/features/calendar/events-queries.ts] (`getCrossCollectiveEventsForRange` — sem filtro de collectiveId)
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-05-05.md] (D3, D5, H2 definidos)
- [Source: _bmad-output/implementation-artifacts/hk-1-refatorar-daydetailsheet-e-updateevent.md] (Padrões HK.1, 410 testes baseline)
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-Housekeeping] (HK.2 — ACs originais)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] (Naming, Zod-first, API wrapper)

## Dev Agent Record

### Agent Model Used

opencode-go/deepseek-v4-flash

### Debug Log References

### Completion Notes List

- **T1 RLS:** Removida condição `AND (is_name_public = true OR is_location_public = true OR is_lineup_public = true)` da `events_select_policy` em `010_events_rls.sql`. Criada `011_fix_rls_divergence.sql` com política simplificada. `filterEventForViewer` verificada e intacta.
- **T2 Race Condition:** `setCrossEvents(result)` removido do `queryFn` em `useCrossCollectiveEvents`. Adicionado `useEffect` que sincroniza `query.data` → `setCrossEvents` após commit do TanStack Query. `DayDetailSheet` merge verificado e intacto.
- **T3 Validação:** 418 testes passam (34 files), type-check zero erros, lint zero warnings. Nenhum arquivo de teste modificado — regressão zero.

### File List

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/010_events_rls.sql` | MODIFIED |
| `supabase/migrations/011_fix_rls_divergence.sql` | CREATED |
| `src/features/calendar/hooks.ts` | MODIFIED |

### Change Log

- **2026-05-06:** RLS simplificada em `010_events_rls.sql` + nova migração `011_fix_rls_divergence.sql`. Race condition corrigida em `hooks.ts` (setCrossEvents movido de queryFn para useEffect). 418 testes passam, type-check zero, lint zero.
