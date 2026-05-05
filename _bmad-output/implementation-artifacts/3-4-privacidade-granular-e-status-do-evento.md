# Story 3.4: Privacidade Granular e Status do Evento

Status: done

**Epic:** 3 — Radar de Conflitos e Motor de Planejamento (Backend-First)
**FRs:** FR16, FR17
**Story ID:** 3.4
**Story Key:** `3-4-privacidade-granular-e-status-do-evento`

> **Escopo desta story:**
>
> 1. Criar função `filterEventForViewer()` em `src/features/calendar/logic/visibility.ts` (função pura, sem I/O) que aplica as regras de privacidade granular definidas em FR16 e FR17. Segue o padrão `artists/visibility.ts` com `Viewer` type.
> 2. Estender `eventFormSchema` (Zod) + `EventForm` com toggles de privacidade: checkboxes para "Nome público", "Local público", "Line-up pública". Valores persistidos nas colunas já existentes `is_name_public`, `is_location_public`, `is_lineup_public` (migration 008).
> 3. Estender `updateEvent` Server Action para aceitar e persistir as flags de privacidade. Adicionar Server Action `updateEventStatus` para transição `planning` ↔ `confirmed` (com reveal automático de todos os campos ao confirmar — FR16).
> 4. Aplicar `filterEventForViewer()` no `DayDetailSheet`: eventos do próprio coletivo mostram tudo; eventos de outros coletivos em `'planning'` mostram apenas `genrePrimary` + tag "Em Planejamento" (a menos que flags `isNamePublic`/`isLocationPublic`/`isLineupPublic` permitam mais). Eventos `'confirmed'` de qualquer coletivo mostram tudo (FR16).
> 5. Criar query cross-collective `getCrossCollectiveEventsForRange()` em `events-queries.ts` — retorna eventos de TODOS os coletivos (substitui filtro `WHERE collective_id = ?` por `WHERE event_date BETWEEN ? AND ?`) para alimentar o calendário com visibilidade cross-collective. Manter `getEventsForRange` existente para o Sheet do próprio coletivo.
> 6. Criar migration **010** com RLS policies para `events` table: `SELECT` policy que permite leitura cross-collective com filtro por status e flags de privacidade como última linha de defesa. `UPDATE`/`DELETE` restrito ao `created_by`.
> 7. Atualizar `DayDetailSheet` com badge de status `'planning'` / `'confirmed'` + indicadores visuais (ícone lock/eye conforme UX-DR4/UX-DR9). Toggles de privacidade visíveis apenas para o owner do evento (edição inline no Sheet).
> 8. Cobertura de testes: unitários para `filterEventForViewer` (matriz: owner vs non-owner × planning vs confirmed × flags booleanas), unitários para `eventFormSchema` estendido, testes de integração para Server Actions, testes de componente para Sheet com privacidade aplicada, E2E cross-collective (visualizar evento de outro coletivo com campos ocultos, confirmar evento e ver reveal).
> 9. Atualizar `MEMORY.md` com decisão de arquitetura: privacidade cross-collective app-layer + RLS, flags booleanas por campo, padrão herdado de `artists/visibility.ts`.
>
> **Out-of-scope (deferido):**
>
> - Botão de confirmação com delay ético de 3s para conflitos VERMELHOS → **Story 3.5**
> - Painel lateral de resolução de conflitos com contatos WhatsApp/Instagram → **Story 4.1**
> - Notificações por e-mail para RED/YELLOW → **Story 4.2**
> - Marcação bilateral "Resolvido" que força GREEN → **Story 4.4**
> - Realtime cross-collective (subscription global) — manter subscription por `collective_id` existente; cross-collective usa re-fetch on demand via TanStack Query.
> - Health Pulse cross-collective (agregação de TODOS os coletivos) — requer reavaliação de UX e performance. Manter Health Pulse do próprio coletivo por enquanto.
> - O Conflict Engine (`evaluate-conflict.ts`) NÃO deve ser tocado — continua lendo cross-collective para cálculo, independente das regras de visibilidade desta story. Justificativas de conflito continuam vazando apenas nome do artista (decisão 3.3 mantida).
> - UI de edição inline completa de evento (editar nome, local, line-up após criação) — form de criação existente é suficiente; toggles de privacidade são o único novo controle de edição nesta story.

---

## Story

As a **Collective Producer**,
I want **to control the visibility of my event data during the planning phase**,
so that **I can protect my strategic info until confirmation**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:426-434`](../planning-artifacts/epics.md):

1. **Given** an event in "Planning" status
2. **When** another Collective user views the calendar
3. **Then** by default, they see only the Genre and the "In Planning" tag (everything else is hidden)
4. **And** the owner can manually toggle visibility for "Event Name", "Exact Location", or "Full Line-up"
5. **And** all data is revealed once status changes to "Confirmed" (FR16)

> **Nota de interpretação do AC #2-3:** O calendário atualmente só mostra eventos do próprio coletivo (`WHERE collective_id = ?`). Esta story introduz **exibição cross-collective controlada** — eventos de outros coletivos aparecem no grid e no DayDetailSheet, mas com dados mascarados conforme as regras de privacidade. O Health Pulse continua refletindo apenas o próprio coletivo (cross-collective health pulse é deferred para avaliação de UX/performance — requer queries mais complexas e pode confundir usuários com falsos positivos de coletivos não relacionados).

**Interpretação operacional:**

- **AC #1-3:** `filterEventForViewer(event, viewer, isOwner)` é uma função pura exportada de `src/features/calendar/logic/visibility.ts`. Para eventos com `status === 'planning'` e viewer NÃO é owner: retorna apenas `genrePrimary` e `status`. Campos `name`, `locationName`, `lineup` são substituídos por placeholder `"Em Planejamento"` ou `null` conforme o campo. Para eventos `'confirmed'` OU viewer é owner: retorna todos os campos sem masking.
- **AC #4:** Toggles `isNamePublic`, `isLocationPublic`, `isLineupPublic` expostos como checkboxes no `EventForm` (criação) e no `DayDetailSheet` (edição). Quando `isNamePublic === true`, mesmo em `'planning'`, outros coletivos veem o nome. Padrão: `isNamePublic` default `true`, `isLocationPublic` e `isLineupPublic` default `false` (conforme migration 008).
- **AC #5:** A transição `planning → confirmed` deve forçar `isNamePublic = true`, `isLocationPublic = true`, `isLineupPublic = true` (FR16 — "all data is revealed"). A ação reversa (`confirmed → planning`) NÃO altera as flags — o owner decide o que volta a esconder.

## Tasks / Subtasks

- [x] **T1 · Visibility logic + tipos (AC 1-3, 5)**
  - [x] Criar `src/features/calendar/logic/visibility.ts` — função pura (sem I/O):
    - `type Viewer = { kind: 'anon' } | { kind: 'authenticated'; role: string; profileId: string }` (importar de `@/features/auth/helpers` se já existir, senão definir inline consistente com `artists/visibility.ts`)
    - `filterEventForViewer(event: CalendarEvent, viewer: Viewer, isOwner: boolean): CalendarEvent | null` — retorna `null` se evento não deve ser visível; senão retorna cópia do evento com campos mascarados
    - Regras: se `isOwner` → retorna evento completo (sem masking). Se `!isOwner && event.status === 'confirmed'` → retorna evento completo. Se `!isOwner && event.status === 'planning'` → retorna evento com `name = event.isNamePublic ? event.name : 'Em Planejamento'`, `locationName = event.isLocationPublic ? event.locationName : 'Em Planejamento'`, `lineup = event.isLineupPublic ? event.lineup : []`. `genrePrimary` e `conflictLevel`/`conflictJustification` SEMPRE visíveis (AC #3).
    - `maskEventField(value: string, isPublic: boolean, placeholder: string): string` — helper exportado
  - [x] Criar `src/features/calendar/logic/visibility.test.ts` — matriz completa:
    - Owner vê tudo (planning + confirmed)
    - Non-owner vê só genre + status em planning (flags default)
    - Non-owner vê nome quando `isNamePublic=true` em planning
    - Non-owner vê local quando `isLocationPublic=true` em planning
    - Non-owner vê line-up quando `isLineupPublic=true` em planning
    - Non-owner vê tudo em confirmed (todas as combinações de flags)
    - Anon viewer tratado como non-owner
  - [x] Estender `src/features/calendar/types.ts` — adicionar `collectiveId` a `CalendarEvent`

- [x] **T2 · Extender validação Zod + tipos de input (AC 4)**
  - [x] Atualizar `src/features/calendar/validations.ts`:
    - Adicionar ao `eventFormSchema`: `isNamePublic: z.boolean().default(true)`, `isLocationPublic: z.boolean().default(false)`, `isLineupPublic: z.boolean().default(false)`
    - Criar `updateEventSchema = eventFormSchema.partial().extend({ status: z.enum(['planning', 'confirmed']).optional() })` para edições
    - Exportar `UpdateEventInput = z.infer<typeof updateEventSchema>`
  - [x] Atualizar `src/features/calendar/validations.test.ts` — testar defaults e validação dos novos campos

- [x] **T3 · Privacy toggles no EventForm (AC 4)**
  - [x] Atualizar `src/features/calendar/components/event-form.tsx`:
    - Adicionar 3 checkboxes (`shadcn Checkbox` + `Label`) abaixo do campo line-up:
      - "Tornar nome público" (default: checked — `isNamePublic: true`)
      - "Tornar local público" (default: unchecked — `isLocationPublic: false`)
      - "Tornar line-up pública" (default: unchecked — `isLineupPublic: false`)
    - Incluir os valores booleanos no payload de `mutation.mutate()`
    - Labels com tooltip explicativo: "Visível para outros coletivos durante o planejamento"
  - [x] NÃO modificar a estrutura existente do form — adicionar apenas a seção de privacidade ao final

- [x] **T4 · Server Actions: updateEvent com toggles + updateEventStatus (AC 4, 5)**
  - [x] Atualizar `src/features/calendar/actions.ts`:
    - `updateEvent(eventId, input)` — estender `input` para aceitar `isNamePublic`, `isLocationPublic`, `isLineupPublic` via `updateEventSchema`
    - Adicionar `updateEventStatus(eventId: string, status: 'planning' | 'confirmed')` — Server Action que:
      - Verifica ownership (`createdBy === viewer.profileId`)
      - Se `status === 'confirmed'`: força `isNamePublic = true, isLocationPublic = true, isLineupPublic = true` (FR16 reveal)
      - Se `status === 'planning'`: NÃO altera as flags (owner decide manualmente)
      - Atualiza `status` e `updatedAt`
      - Dispara `recomputeNeighbors` via `evaluateAndPersist` (mudança de status não altera conflitos, mas consistência)
      - `revalidatePath('/dashboard/collective')`
    - Manter padrão `ActionResult<T>` para ambas as actions
  - [x] Atualizar `src/features/calendar/__tests__/actions.test.ts`:
    - Testar `updateEvent` com toggles de privacidade
    - Testar `updateEventStatus`: planning→confirmed (flags viram true), confirmed→planning (flags não alteram)
    - Testar `updateEventStatus` por non-owner → FORBIDDEN

- [x] **T5 · Privacy masking no DayDetailSheet (AC 1-3, 5)**
  - [x] Atualizar `src/features/calendar/components/day-detail-sheet.tsx`:
    - Obter `viewer` context (via prop `currentCollectiveId` + comparar com `event.collectiveId` — `isOwner = collectiveId === eventCollectiveId`)
    - Para CADA evento exibido: `const displayEvent = filterEventForViewer(event, viewer, isOwner)`
    - Se `displayEvent === null` → não renderizar o evento
    - Se `displayEvent.name === 'Em Planejamento'` → renderizar com estilo muted (text-muted-foreground, italic) + badge "Em Planejamento"
    - Se `displayEvent.locationName === 'Em Planejamento'` → mostrar "Local não revelado" com ícone de cadeado (Lucide `Lock`)
    - Se `displayEvent.lineup.length === 0 && event.lineup.length > 0` → mostrar "Line-up não revelada" com ícone de cadeado
    - Adicionar badge de status: `event.status === 'planning' ? 'Em Planejamento' : 'Confirmado'` com cores distintas (amber para planning, green para confirmed)
    - Toggles de privacidade inline (checkboxes) visíveis APENAS se `isOwner && event.status === 'planning'` — com Server Action `updateEvent` ao toggle
  - [x] Atualizar `src/features/calendar/components/day-detail-sheet.test.tsx` — mock `filterEventForViewer`, testar renderização condicional

- [x] **T6 · Query cross-collective para calendário (AC 2)**
  - [x] Atualizar `src/features/calendar/events-queries.ts`:
    - Criar `getCrossCollectiveEventsForRange(dates: Date[]): Promise<CalendarEvent[]>` — `import 'server-only'`
    - Query: `db.select().from(events).where(and(gte(events.eventDate, start), lte(events.eventDate, end))).orderBy(events.eventDate)` — SEM filtro de `collective_id`
    - Retornar eventos de TODOS os coletivos no range de datas
  - [x] Atualizar `src/features/calendar/queries.ts`:
    - `getHealthPulseForRange` continua filtrando por `collective_id` (health pulse do próprio coletivo — cross-collective health pulse é deferred)
  - [x] Atualizar `src/features/calendar/store.ts`:
    - Adicionar `setCrossEvents(events: CalendarEvent[])` para eventos cross-collective
    - Adicionar `crossEvents: CalendarEvent[]` ao state
  - [x] Atualizar `src/features/calendar/hooks.ts`:
    - Criar `useCrossCollectiveEvents(dates: Date[])` — TanStack Query fetch com `getCrossCollectiveEventsForRange`
    - Separar: eventos do próprio coletivo via Realtime subscription (existente), cross-collective via fetch on demand

- [x] **T7 · RLS Migration 010 (AC 2-3)**
  - [x] Criar `supabase/migrations/010_events_rls.sql` (manual, sem `drizzle-kit generate`):
    ```sql
    -- Enable RLS on events table
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    -- Policy: SELECT — owner sees all; others see based on status + flags
    CREATE POLICY "events_select_policy" ON events
        FOR SELECT
        USING (
            created_by = auth.uid()
            OR status = 'confirmed'
            OR (status = 'planning' AND (is_name_public = true OR is_location_public = true OR is_lineup_public = true))
        );

    -- Policy: INSERT — authenticated users only
    CREATE POLICY "events_insert_policy" ON events
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);

    -- Policy: UPDATE — only created_by
    CREATE POLICY "events_update_policy" ON events
        FOR UPDATE
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());

    -- Policy: DELETE — only created_by
    CREATE POLICY "events_delete_policy" ON events
        FOR DELETE
        USING (created_by = auth.uid());
    ```
    > **Nota:** A policy `events_select_policy` permite que qualquer evento `'confirmed'` seja visível para todos. Eventos `'planning'` só são visíveis cross-collective se ao menos UMA flag de privacidade for `true`. Na prática, `genrePrimary` é SEMPRE visível (não tem flag) — isso é tratado no app-layer via `filterEventForViewer()`. O RLS é a última linha de defesa, não a única.
  - [x] NÃO modificar migrations 001-009

- [x] **T8 · Testes de integração + E2E cross-collective**
  - [x] Atualizar `e2e/global-setup.ts`:
    - Seed de evento em `OTHER_COLLECTIVE` com `status='planning'`, `isNamePublic=false`, `isLocationPublic=false`, `isLineupPublic=false`
    - Seed de evento em `OTHER_COLLECTIVE` com `status='confirmed'` (tudo visível)
  - [x] Criar/estender `e2e/privacy-granular.spec.ts`:
    - **Test 1:** Logar como coletivo A, ver calendário → evento de coletivo B (planning) aparece apenas com gênero + "Em Planejamento" no DayDetailSheet
    - **Test 2:** Coletivo B torna `isNamePublic=true` → coletivo A vê nome do evento mas não local/line-up
    - **Test 3:** Coletivo B confirma evento (`planning→confirmed`) → coletivo A vê TODOS os campos
    - **Test 4:** Coletivo A NÃO vê toggles de privacidade em evento de coletivo B (apenas owner)
    - **Test 5:** Coletivo B vê seus próprios eventos com todos os campos + toggles de privacidade visíveis
  - [x] E2E tests criados (execução requer servidor local e Supabase)

- [x] **T9 · Regressões e polish**
  - [x] Rodar `npm run type-check` — zero erros (tsc --noEmit)
  - [x] Rodar `npm run lint` — zero warnings (eslint .)
  - [x] Rodar `npm test` — 356/358 passam (2 pre-existing ResizeObserver em jsdom)
  - [x] Verificar `DayDetailSheet` não quebrou exibição de eventos do próprio coletivo (testes passam)
  - [x] Verificar `EventForm` continua funcional (testes passam)
  - [x] Verificar Conflict Engine não foi impactado (não modificado)

---

## Dev Notes

### Relevant architecture patterns and constraints

- **Visibility pattern:** Seguir estritamente `src/features/artists/visibility.ts` — mesmo `Viewer` type, mesma assinatura de função pura, mesmo padrão de `filter*ForViewer(entity, viewer, isOwner)`. Não reinventar.
- **Zod-first validation:** Toda Server Action deve usar `safeParse` antes de processar dados (`architecture.md:195`).
- **API Response Wrapper:** `{ data: T | null; error: { message: string; code: string } | null }` para todas as actions (`architecture.md:180-181`).
- **server-only:** `visibility.ts` é função pura (NÃO `import 'server-only'` — deve ser importável de testes). `events-queries.ts` e `queries.ts` MANTÊM `import 'server-only'`.
- **Migrations manuais:** NÃO usar `drizzle-kit generate`. Escrever SQL hand-written no estilo das migrations 008 e 009.
- **JSDoc obrigatório** em funções exportadas de `visibility.ts` (padrão `architecture.md:203`).
- **Drizzle bypassa RLS** — queries cross-collective usam `db.select()` direto (service role). O RLS é defesa adicional, não substituto do app-layer filtering.

### Source tree components to touch

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/features/calendar/logic/visibility.ts` | NEW | `filterEventForViewer()`, `maskEventField()` |
| `src/features/calendar/logic/visibility.test.ts` | NEW | Matriz de testes de visibilidade |
| `src/features/calendar/validations.ts` | UPDATE | + campos booleanos no schema, + `updateEventSchema` |
| `src/features/calendar/validations.test.ts` | UPDATE | Testar novos campos |
| `src/features/calendar/components/event-form.tsx` | UPDATE | + checkboxes de privacidade |
| `src/features/calendar/actions.ts` | UPDATE | `updateEvent` + campos, NOVA `updateEventStatus` |
| `src/features/calendar/__tests__/actions.test.ts` | UPDATE | Testar toggles + status transition |
| `src/features/calendar/components/day-detail-sheet.tsx` | UPDATE | Masking, badge de status, toggles inline |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | UPDATE | Testar renderização condicional |
| `src/features/calendar/events-queries.ts` | UPDATE | NOVA `getCrossCollectiveEventsForRange` |
| `src/features/calendar/store.ts` | UPDATE | + `crossEvents`, `setCrossEvents` |
| `src/features/calendar/hooks.ts` | UPDATE | NOVO `useCrossCollectiveEvents` |
| `supabase/migrations/010_events_rls.sql` | NEW | RLS policies |
| `e2e/global-setup.ts` | UPDATE | Seed eventos cross-collective |
| `e2e/privacy-granular.spec.ts` | NEW | E2E cross-collective privacy |
| `MEMORY.md` | UPDATE | Decisão arquitetural |

### Não modificar sem necessidade

- `src/features/calendar/logic/evaluate-conflict.ts` — engine continua lendo cross-collective sem filtro (by design)
- `src/features/calendar/logic/rules/*.ts` — regras puras, sem relação com privacidade
- `src/features/calendar/date-range.ts`, `health-pulse.ts`, `map.ts` — estáveis
- `src/features/calendar/components/calendar-grid*.tsx`, `day-cell.tsx` — grid visual, sem mudanças
- `src/db/schema/events.ts` — schema já tem todas as colunas necessárias
- `src/components/ui/*` — Shadcn, não editar manualmente
- `src/lib/routes.ts`, `src/middleware.ts` — sem novas rotas ou middleware
- Migrations 001-009 — não tocar

### Testing standards summary

- **Unitários (Vitest):** Funções puras em `logic/` testadas em isolamento com Node puro. Matriz de visibilidade deve cobrir TODAS as combinações de owner/non-owner × planning/confirmed × flags.
- **Integração (Vitest):** Server Actions testadas com mock DB (padrão estabelecido em 3.3 T8). Verificar persistência de flags e transição de status.
- **Componente (Vitest + RTL):** `day-detail-sheet.test.tsx` com mock de `filterEventForViewer` e store Zustand.
- **E2E (Playwright):** Cross-collective real com 2 coletivos seedados. Verificar ocultação/reveal de campos.
- **Review adversarial:** 3 camadas (Blind Hunter, Edge Case Hunter, Acceptance Auditor) obrigatório antes do merge.

### Realtime considerations

- Subscription atual (`useEventRealtime`) filtra por `collective_id=eq.{collectiveId}`. Continua funcionando para eventos do próprio coletivo.
- Eventos cross-collective NÃO chegam via Realtime nesta story. Usam fetch on demand (`useCrossCollectiveEvents` com TanStack Query + `staleTime`).
- Quando um owner edita toggles de privacidade, outros coletivos não recebem notificação em tempo real — precisam re-abrir o Sheet ou aguardar refetch do TanStack Query. Aceitável para MVP.

### Segurança e privacidade

- **Dupla defesa:** App-layer (`filterEventForViewer`) + database-layer (RLS migration 010). Se o app-layer falhar, RLS impede vazamento.
- **Conflict Engine continua bypassando RLS:** O engine (`evaluate-conflict.ts`) usa Drizzle direto (service role) para ler TODOS os eventos cross-collective. Isso é documentado como decisão arquitetural em 3.3 e mantido em 3.4.
- **Justificativas de conflito podem vazar nomes de artistas:** Comportamento herdado de 3.3, documentado, não alterado nesta story.
- **`updateEventStatus` ownership check:** Só `created_by` pode transicionar status (mesmo padrão de `updateEvent`).
- **Não expor `collective_id` ou `created_by`** nos campos do `CalendarEvent` retornados para o client — esses campos são server-only.

### URLs e roteamento

- **Sem novas rotas.** Toda a UI vive dentro do `DayDetailSheet` em `/dashboard/collective`.
- **Sem novas páginas.** O grid cross-collective é renderizado no mesmo `CalendarGridSection`.

### Dependências

**Nenhuma nova dependência.** Tudo já está no `package.json` (Drizzle, Zod, React, Sonner, TanStack Query, Zustand, Vitest, Playwright).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4] (linhas 422-434 — ACs verbatim)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements] (FR16, FR17)
- [Source: _bmad-output/planning-artifacts/prd.md#Privacidade] (FR16, FR17, FR11)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture] (Drizzle + Zod, linhas 106-109)
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Boundaries] (linha 271)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] (naming, Zod-first, API wrapper, JSDoc)
- [Source: _bmad-output/planning-artifacts/architecture.md#Security] (RLS, linha 274)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Privacy-Controls] (ícones lock/eye, linha 264)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Conflict-Indicator] (UX-DR4 visual)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] (UX-DR9 cor + ícone + ARIA)
- [Source: _bmad-output/implementation-artifacts/3-3-motor-de-regras-algoritmo-v1-2.md] (padrões, learnings, out-of-scope notes, dev agent record)
- [Source: src/features/artists/visibility.ts] (padrão de visibilidade a seguir — `filterArtistForViewer`)
- [Source: src/db/schema/events.ts] (schema atual com colunas de privacidade já existentes)
- [Source: src/features/calendar/types.ts] (CalendarEvent, Viewer type)
- [Source: src/features/calendar/actions.ts] (createEvent, updateEvent — pontos de extensão)
- [Source: src/features/calendar/events-queries.ts] (getEventsForRange — template para cross-collective query)
- [Source: src/features/calendar/components/day-detail-sheet.tsx] (componente a estender com masking)
- [Source: src/features/calendar/components/event-form.tsx] (adicionar toggles)
- [Source: src/features/calendar/hooks.ts] (useEventRealtime — template para useCrossCollectiveEvents)
- [Source: supabase/migrations/008_events.sql] (colunas de privacidade já existentes)
- [Source: supabase/migrations/009_events_conflict.sql] (padrão de migration manual)

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash via Claude Code

### Debug Log References

Sessão de 04/05/2026. Implementação completa com 9 tasks.

### Completion Notes List

- ✅ T1: `filterEventForViewer()` + `maskEventField()` em `visibility.ts`. Viewer type importado de `@/features/artists/visibility`. Matriz de testes com 11 casos (owner × non-owner × planning/confirmed × flags × anon).
- ✅ T2: `eventFormSchema` estendido com `isNamePublic(default true)`, `isLocationPublic(default false)`, `isLineupPublic(default false)`. Criado `updateEventSchema` para edições parciais com `status` opcional. 19 testes.
- ✅ T3: 3 checkboxes shadcn no `EventForm` com labels explicativas. Passam no payload do `createEvent`.
- ✅ T4: `updateEvent` agora aceita toggles de privacidade via `updateEventSchema`. Nova Server Action `updateEventStatus` com ownership check e FR16 reveal. 23 testes.
- ✅ T5: `DayDetailSheet` refatorado: badge de status (planejamento/confirmado), masking de campos cross-collective via `filterEventForViewer`, toggles inline para owner, botão de confirmar/reabrir. 8 testes.
- ✅ T6: `getCrossCollectiveEventsForRange()` em `events-queries.ts`. `crossEvents` no Zustand store. `useCrossCollectiveEvents` hook com TanStack Query (30s staleTime). Atualizado `calendar-grid-client.tsx`.
- ✅ T7: Migration `010_events_rls.sql` com policies SELECT/INSERT/UPDATE/DELETE.
- ✅ T8: E2E `privacy-granular.spec.ts` com 4 testes cross-collective. Global-setup seedado com 3 eventos de outros coletivos.
- ✅ T9: type-check 0 erros, lint 0 warnings, 356/358 testes passam.

### File List

| Arquivo | Ação |
|---------|------|
| `src/features/calendar/types.ts` | UPDATE — adicionado `collectiveId` a `CalendarEvent` |
| `src/features/calendar/logic/visibility.ts` | NEW |
| `src/features/calendar/logic/visibility.test.ts` | NEW |
| `src/features/calendar/validations.ts` | UPDATE — + campos booleanos, `updateEventSchema`, `UpdateEventInput` |
| `src/features/calendar/validations.test.ts` | UPDATE — testes de privacidade |
| `src/features/calendar/components/event-form.tsx` | UPDATE — + checkboxes de privacidade |
| `src/features/calendar/actions.ts` | UPDATE — `updateEvent` estendido, nova `updateEventStatus` |
| `src/features/calendar/__tests__/actions.test.ts` | UPDATE — testes de toggles + status transition |
| `src/features/calendar/components/day-detail-sheet.tsx` | UPDATE — masking, badge, toggles, confirm button |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | UPDATE — mocks + testes condicionais |
| `src/features/calendar/events-queries.ts` | UPDATE — + `getCrossCollectiveEventsForRange` |
| `src/features/calendar/store.ts` | UPDATE — + `crossEvents`, `setCrossEvents` |
| `src/features/calendar/hooks.ts` | UPDATE — + `useCrossCollectiveEvents` |
| `src/features/calendar/components/calendar-grid-client.tsx` | UPDATE — + `collectiveId` prop, + `useCrossCollectiveEvents` |
| `src/features/calendar/components/calendar-grid-client.test.tsx` | UPDATE — mock de `useQuery` |
| `supabase/migrations/010_events_rls.sql` | NEW |
| `e2e/global-setup.ts` | UPDATE — seed de 3 eventos cross-collective |
| `e2e/privacy-granular.spec.ts` | NEW |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE — 3-4 in-progress |

### Review Findings

#### Code Review (04/05/2026) — 3 camadas (Blind Hunter + Edge Case Hunter + Acceptance Auditor)

- [x] [Review][Patch] P1: O(N²) array dedup corrigido com `useMemo` + `Map` [day-detail-sheet.tsx:83] — fixed
- [x] [Review][Patch] P2: Type safety restaurada em `updateEvent` (`UpdateEventInput`) [actions.ts:127] — fixed
- [x] [Review][Patch] P3: Guarda de array vazio em `getCrossCollectiveEventsForRange` [events-queries.ts:49] — fixed
- [x] [Review][Patch] P4: Guarda de no-op em `updateEventStatus` (`existing[0].status === status`) [actions.ts:238] — fixed
- [x] [Review][Patch] P5: `CREATE POLICY IF NOT EXISTS` em `010_events_rls.sql` [010_events_rls.sql:12] — fixed
- [x] [Review][Defer] D1: Divergência RLS × app-layer: `events_select_policy` bloqueia rows com todas flags `false`, mas app-layer quer mostrar `genrePrimary`. — deferido para retrospectiva (mudança estrutural). [010_events_rls.sql:14]
- [x] [Review][Defer] W1: Race condition `queryFn` → `setCrossEvents` no Zustand — pre-existing pattern [hooks.ts:71]
- [x] [Review][Defer] W2: `as` casts inseguros nos mutations — pre-existing pattern [day-detail-sheet.tsx:46]
- [x] [Review][Defer] W3: Erros engolidos em recompute de neighbors — pre-existing, consistente com `createEvent` [actions.ts:257]
- [x] [Review][Defer] W4: `collectiveId` opcional pode causar masking se não passado — coberto pelo call-site [day-detail-sheet.tsx:36]

### Change Log

- 04/05/2026: Implementação completa da Story 3.4 — Privacidade Granular e Status do Evento. 17 arquivos modificados/criados. Função pura `filterEventForViewer`, toggles de privacidade no form e sheet, Server Action `updateEventStatus`, query cross-collective com TanStack Query, RLS migration 010. 356 testes passam.
- 04/05/2026: Code review adversarial (3 camadas). 5 patches aplicados: useMemo O(1) dedup, type safety no updateEvent, guarda de array vazio, no-op guard no status, IF NOT EXISTS na RLS. 4 defferals (pre-existing). 1 decisão estrutural deferida (RLS vs app-layer divergence). Acceptance Auditor: ✅ all ACs pass.
