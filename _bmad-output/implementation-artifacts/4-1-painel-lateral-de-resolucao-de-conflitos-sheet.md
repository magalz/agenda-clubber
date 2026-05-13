# Story 4.1: Painel Lateral de Resolução de Conflitos (Sheet)

Status: review

## Story

As a **Producer with a flagged conflict**,
I want **to access the contact details of the conflicting collective instantly**,
so that **I can negotiate a resolution without leaving the context of the calendar**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:580-604`](../planning-artifacts/epics.md) e UX-DR5 / UX-DR9:

1. **Given** an event flagged as **RED** or **YELLOW** on the calendar
2. **When** the user clicks on the conflict indicator (badge)
3. **Then** a side panel (`Sheet`) must open with details of the conflicting event (respecting current privacy toggles)
4. **And** it must display direct action buttons: "Chamar no WhatsApp" (deep link to `wa.me`) and "Ver Instagram" (URL link) of the collective owner
5. **And** it must include semantic icons for accessibility (UX-DR9)

> **Nota de interpretação:**
> - **AC #1-2:** O trigger é o clique no `ConflictBadge` do `EventCard` dentro do `DayDetailSheet`. Só RED e YELLOW abrem o painel — GREEN não é interativo.
> - **AC #3:** As conflicting events são identificadas via tabela `event_conflicts` (já populada por `syncConflictPairs` em `evaluate-conflict.ts:207`). Detalhes devem respeitar `filterEventForViewer` (privacidade granular — `isNamePublic`, `isLocationPublic`, `isLineupPublic`).
> - **AC #4:** WhatsApp deep link: `https://wa.me/<whatsappPhone>` (remover `+` e espaços). Instagram: link direto para o `socialLinks.instagram` do coletivo. Ambos campos já existem no schema (`collectives.whatsappPhone`, `collectives.socialLinks.instagram`).
> - **AC #5:** Ícones semânticos: `MessageCircle` (WhatsApp), `Instagram` (lucide-react) + atributos `aria-label` descritivos em português.

## Tasks / Subtasks

- [x] **T1 · Query server para eventos conflitantes (AC 3)**
  - [x] Criar `getConflictingEvents(eventId)` em `src/features/calendar/queries.ts`
  - [x] Query `event_conflicts` onde `event_a_id = X OR event_b_id = X` com `status = 'open'`
  - [x] Para cada par, fetch do outro evento (o que NÃO é o eventId do trigger)
  - [x] Aplicar `filterEventForViewer` aos eventos externos (anon, não-owner)
  - [x] Fetch coletivo (`name`, `whatsappPhone`, `socialLinks`) para cada evento conflitante
  - [x] Testes unitários (3 cenários: conflito unilateral, bilateral, sem conflitos)

- [x] **T2 · Componente ConflictResolutionSheet (AC 3, 4, 5)**
  - [x] Criar `src/features/calendar/components/conflict-resolution-sheet.tsx`
  - [x] Usar `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` do `@/components/ui/sheet`
  - [x] Exibir: nome do evento conflitante (com lock se mascarado), gênero, data, justificativa do conflito
  - [x] Exibir: nome e logo do coletivo conflitante (usar `CollectiveCard` compacto)
  - [x] Botão WhatsApp: `MessageCircle` icon + `wa.me/<phone>` deep link — abrir em nova aba
  - [x] Botão Instagram: `Instagram` icon + link para `socialLinks.instagram` — abrir em nova aba
  - [x] Estados: loading (skeleton), empty ("Nenhum conflito ativo"), erro (toast)
  - [x] Estética "Line-over-Black": bordas 1px, fundo `bg-popover`, cores neon para badges

- [x] **T3 · Tornar ConflictBadge clicável no EventCard (AC 2)**
  - [x] Modificar `src/features/calendar/components/event-card.tsx`
  - [x] Adicionar prop `onConflictClick?: (eventId: string) => void`
  - [x] Envolver `ConflictBadge` em `<button>` com `cursor-pointer` + `aria-label="Ver detalhes do conflito"`
  - [x] Apenas RED e YELLOW são clicáveis; GREEN permanece estático
  - [x] Testes: badge RED/YELLOW chama onConflictClick; badge GREEN não chama; botão tem aria-label

- [x] **T4 · Integrar ConflictResolutionSheet no DayDetailSheet (AC 1)**
  - [x] Modificar `src/features/calendar/components/day-detail-sheet.tsx`
  - [x] Adicionar estado `selectedConflictEventId` + renderização de `ConflictResolutionSheet`
  - [x] Passar `onConflictClick` para cada `EventCard`
  - [x] `ConflictResolutionSheet` fecha independentemente do `DayDetailSheet` (pode ser nested Sheet ou Sheet separada — preferir Sheet irmã no mesmo nível)
  - [x] Alternativa: gerenciar via store para evitar prop drilling

- [x] **T5 · Nova query no store e calendário (AC 1-3)**
  - [x] Opcional (se usar store): adicionar `selectedConflictEventId` no `CalendarStore`
  - [x] Modificar `calendar-grid-client.tsx` se necessário para renderizar `ConflictResolutionSheet`
  - [x] Garantir que crossEvents estão disponíveis e atualizados (já são)

- [x] **T6 · Testes do ConflictResolutionSheet**
  - [x] Teste unitário: renderiza eventos conflitantes com nome, gênero, justificativa
  - [x] Teste unitário: botão WhatsApp renderiza link `wa.me/<phone>` correto
  - [x] Teste unitário: botão Instagram renderiza link correto
  - [x] Teste unitário: estado vazio (sem conflitos) mostra mensagem
  - [x] Teste unitário: loading state (skeleton)
  - [x] Teste unitário: eventos mascarados mostram "Em Planejamento" + Lock icon

- [x] **T7 · E2E**
  - [x] Cenário 1: clique no ConflictBadge RED → abre sheet → mostra evento conflitante → botão WhatsApp visível
  - [x] Cenário 2: conflito YELLOW → abre sheet → evento mascarado (privacidade) → mostra "Em Planejamento"
  - [x] Cenário 3: evento GREEN → badge não é clicável

- [x] **T8 · Regressões e qualidade**
  - [x] `npm run type-check` — zero erros
  - [x] `npm run lint` — zero warnings
  - [x] `npm test` — todos passam (atuais: ~488)
  - [x] Verificar que `DayDetailSheet` existente não quebrou (eventos, formulário, status toggle)
  - [x] Verificar que `EventCard` existente não quebrou (ethical delay, visibility toggles)
  - [x] `npm run qa:memtrace` — gate passa

## Dev Notes

### Arquitetura de conflitos (padrão estabelecido)

O modelo de conflitos é **pair-based** e **persistido**:

```
evaluateAndPersist(eventId)
  → evaluateConflict() calcula RED/YELLOW/GREEN
  → grava conflictLevel + conflictJustification no evento
  → syncConflictPairs() persiste pares no event_conflicts
```

Para Story 4.1, o `ConflictResolutionSheet` consulta `event_conflicts` para identificar os eventos conflitantes:

```
EventCard click (ConflictBadge RED/YELLOW)
  → DayDetailSheet.onConflictClick(eventId)
    → getConflictingEvents(eventId) [server query]
      → SELECT from event_conflicts WHERE event_a_id = X OR event_b_id = X
      → fetch other event + collective contact info
    → ConflictResolutionSheet render
```

### Código existente — REAPROVEITAR

| Componente | Arquivo | Uso |
|---|---|---|
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` | `src/components/ui/sheet.tsx` | **REUSAR** — base do ConflictResolutionSheet |
| `filterEventForViewer` | `src/features/calendar/logic/visibility.ts:16` | **REUSAR** — filtrar detalhes do evento conflitante |
| `ConflictBadge` | `src/features/calendar/components/conflict-badge.tsx` | **MODIFICAR** — wrapper com onClick |
| `CollectiveCard` | `src/features/collectives/components/collective-card.tsx` | **REUSAR** — mostrar info do coletivo conflitante (modo compacto) |
| `syncConflictPairs` | `src/features/calendar/logic/evaluate-conflict.ts:207` | **NÃO MODIFICAR** — já persiste pares |
| `eventConflicts` schema | `src/db/schema/event-conflicts.ts` | **LER** — tabela já populada |
| `collectives` schema | `src/db/schema/collectives.ts` | **LER** — `whatsappPhone` (E.164), `socialLinks.instagram` |
| `useCalendarStore` | `src/features/calendar/store.ts` | **MODIFICAR** — adicionar estado do ConflictResolutionSheet |

### Código existente — MODIFICAR (com cuidado)

| Arquivo | Mudança | Risco de regressão |
|---|---|---|
| `event-card.tsx` | Adicionar `onConflictClick` prop + botão no ConflictBadge | Baixo — nova prop opcional |
| `day-detail-sheet.tsx` | Adicionar estado + renderização do ConflictResolutionSheet | Médio — não quebrar mutations existentes (status, toggle) |
| `store.ts` | Adicionar `selectedConflictEventId` + setter | Baixo — campo novo |
| `queries.ts` (calendar) | Adicionar `getConflictingEvents` | Nenhum — query nova |

### NÃO modificar

- `src/features/calendar/logic/evaluate-conflict.ts` — Motor de conflitos, NÃO tocar
- `src/features/calendar/logic/visibility.ts` — Filtro de privacidade, NÃO tocar
- `src/db/schema/event-conflicts.ts` — Schema de conflitos, NÃO tocar
- `src/db/schema/collectives.ts` — Schema de coletivos, NÃO tocar
- `src/features/collectives/actions.ts` — Server Actions de coletivos, NÃO tocar
- `EventForm` / `calendar-grid.tsx` / `calendar-grid-client.tsx` — NÃO precisam de mudança (a não ser que use store para o sheet)

### Padrão de query — getConflictingEvents

```ts
// src/features/calendar/queries.ts (server-only)
import { db } from '@/db';
import { eventConflicts } from '@/db/schema/event-conflicts';
import { events } from '@/db/schema/events';
import { collectives } from '@/db/schema/collectives';
import { or, eq, and, ne } from 'drizzle-orm';
import { filterEventForViewer } from './logic/visibility';
import type { CalendarEvent } from './types';

type ConflictingEventInfo = {
  event: CalendarEvent; // com privacidade aplicada
  collective: {
    name: string;
    logoUrl: string | null;
    whatsappPhone: string | null;
    instagramUrl: string | null;
  };
  justification: string;
};

export async function getConflictingEvents(eventId: string): Promise<ConflictingEventInfo[]> {
  // 1. Buscar pares em event_conflicts
  const pairs = await db
    .select()
    .from(eventConflicts)
    .where(or(eq(eventConflicts.eventAId, eventId), eq(eventConflicts.eventBId, eventId)))
    .where(eq(eventConflicts.status, 'open'));

  // 2. Para cada par, identificar o outro evento
  const otherIds = pairs.map(p => p.eventAId === eventId ? p.eventBId : p.eventAId);
  
  // 3. Fetch outros eventos + coletivos
  // 4. Aplicar filterEventForViewer (anon viewer, isOwner=false)
  // 5. Retornar array
}
```

### Formato dos links de contato

```tsx
// WhatsApp: https://wa.me/5511999999999 (sem +, sem espaços, sem hífen)
const waNumber = collective.whatsappPhone?.replace(/[+\s\-]/g, '');
const waLink = `https://wa.me/${waNumber}`;

// Instagram: link direto (se for URL completa) ou https://instagram.com/<user>
const igLink = collective.instagramUrl?.startsWith('http') 
  ? collective.instagramUrl 
  : `https://instagram.com/${collective.instagramUrl}`;
```

### Semantic icons (UX-DR9 / AC 5)

- WhatsApp: `MessageCircle` (lucide-react) com `aria-label="Chamar no WhatsApp: +55 11 99999-9999"`
- Instagram: `Instagram` (lucide-react) com `aria-label="Ver Instagram: @coletivo"`
- Ambos botões com `target="_blank"` e `rel="noopener noreferrer"`
- Botões devem ter `variant="outline"` com borda neon (verde para WhatsApp, rosa para Instagram)

### Privacy: filterEventForViewer no contexto do ConflictResolutionSheet

O viewer é um coletivo que NÃO é dono do evento conflitante. Usar:
```ts
filterEventForViewer(conflictingEvent, { kind: 'anon' }, false)
```
Isso garante que:
- Se `isNamePublic === false`: nome vira "Em Planejamento"
- Se `isLocationPublic === false`: local vira "Em Planejamento"  
- Se `isLineupPublic === false`: line-up vira array vazio
- Se evento `status === 'confirmed'`: todos os dados são visíveis (regra existente)

### Approach recomendado: Store-driven Sheet

Em vez de nested Sheets (que podem causar issues de z-index/foco), usar Sheet como irmã do DayDetailSheet gerenciada via store:

```ts
// store.ts — adicionar:
selectedConflictEventId: string | null;
setSelectedConflictEventId: (id: string | null) => void;

// calendar-grid-client.tsx — renderizar após DayDetailSheet:
<ConflictResolutionSheet
  eventId={store.selectedConflictEventId}
  isOpen={store.selectedConflictEventId !== null}
  onOpenChange={(open) => { if (!open) store.setSelectedConflictEventId(null); }}
/>
```

### Project Structure Notes

- O componente `ConflictResolutionSheet` deve ir em `src/features/calendar/components/` (feature calendar)
- A query `getConflictingEvents` deve ir em `src/features/calendar/queries.ts` (já tem `getHealthPulseForRange`)
- Tipos novos em `src/features/calendar/types.ts`
- Seguir padrão `PascalCase.tsx` para componentes, `camelCase` para funções

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.1`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#UX-DR5`] — Resolution Side Panel (Sheet)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#UX-DR9`] — Accessibility Standards
- [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`] — snake_case DB, camelCase code
- [Source: `_bmad-output/planning-artifacts/architecture.md#API Response Formats`] — `{ data, error }` wrapper
- [Source: `src/features/calendar/logic/evaluate-conflict.ts:207-265`] — `syncConflictPairs` (pair persistence)
- [Source: `src/db/schema/event-conflicts.ts`] — `event_conflicts` table schema
- [Source: `src/db/schema/collectives.ts`] — `whatsappPhone`, `socialLinks`
- [Source: `_bmad-output/implementation-artifacts/epic-4-readiness.md`] — DP1, DP4 resolvidos via correct-course

### Instruções obrigatórias para o dev-agent

- ANTES de codificar, leia `_bmad-output/test-artifacts/atdd-checklist-4-1-painel-lateral-de-resolucao-de-conflitos-sheet.md` — os RED phase tests já estão definidos lá.
- NÃO recrie os testes do zero. Implemente exatamente os 22 cenários ATDD listados no checklist.
- Leia também `_bmad-output/test-artifacts/test-design/4-1-test-design.md` para entender a estratégia, prioridades e dados de seed.
- O QA-Design está completo (pré-DS). Siga o checklist como seu guia de implementação.
- Após implementar, execute `npm test`, `npx playwright test`, `npm run type-check`, `npm run lint` em sequência.

### Dependencies & Cross-story

- **DP1 resolvido:** Eventos cross-visible no grid (correct-course) — eventos com flags públicas são visíveis
- **DP4 resolvido:** Justificativa revela fonte com 3 níveis de revelação progressiva — consistente com `filterEventForViewer`
- **Schema pronto:** `whatsappPhone` em collectives (migration 012), `event_conflicts` (migration 013)
- **Story 4.3 (done):** Padrão WhatsApp estabelecido — mas 4.1 é mais simples (só deep links, sem QStash/Evolution API)
- **Story 4.4 (futuro):** Resolução bilateral usa o mesmo `event_conflicts` — não conflitar

## QA Maturity Checklist

### QA-Design (pré-DS)
- [x] Acceptance test scaffolds gerados (bmad-testarch-atdd) → `_bmad-output/test-artifacts/atdd-checklist-4-1-painel-lateral-de-resolucao-de-conflitos-sheet.md`
- [x] Estratégia de teste definida (bmad-testarch-test-design) → `_bmad-output/test-artifacts/test-design/4-1-test-design.md`

### QA-Verify (pós-DS)
- [ ] Testes unitários passam
- [ ] Testes E2E passam
- [ ] Test-review aprovado (bmad-testarch-test-review)
- [ ] Rastreabilidade ACs → testes verificada (bmad-testarch-trace)
- [ ] Cobertura mínima: 80% linhas, 100% ACs
- [ ] Zero regressões nos testes existentes
- [ ] QA Gate Report emitido e anexado ao story file

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (opencode)

### Debug Log References

- RED phase: 4 arquivos de teste criados/estendidos seguindo ATDD checklist (22 cenarios)
- GREEN phase: getConflictingEvents query + ConflictResolutionSheet component + EventCard onConflictClick + integracao DayDetailSheet/Store/CalendarGrid
- Lint: 0 errors | Type-check: 0 errors | Tests: 493 passed + 14 skipped | qa:memtrace: PASS

### Completion Notes

- Implementada query `getConflictingEvents` que consulta `event_conflicts` com `status='open'` e aplica `filterEventForViewer`
- Criado componente `ConflictResolutionSheet` com botoes WhatsApp (`wa.me`) e Instagram, CollectiveCard compacto, estados loading/empty/error
- `ConflictBadge` tornado clicavel via prop `onConflictClick`; RED/YELLOW abrem sheet, GREEN permanece estatico
- Integracao via store-driven: `selectedConflictEventId` no Zustand, Sheet irma no `CalendarGridClient`
- Server action `getConflictingEventsAction` wrapper para chamada client-side
- Todos os 22 cenarios ATDD implementados entre unit tests (19) e E2E (3)
- Testes existentes (493) passam sem regressao; DayDetailSheet e EventCard intactos

### File List

- `src/features/calendar/queries.ts` — Adicionado `getConflictingEvents`
- `src/features/calendar/queries.test.ts` — Estendido com `describe('getConflictingEvents')` (3 testes)
- `src/features/calendar/types.ts` — Adicionado `ConflictingEventInfo`
- `src/features/calendar/actions.ts` — Adicionado `getConflictingEventsAction`
- `src/features/calendar/store.ts` — Adicionado `selectedConflictEventId` + setter
- `src/features/calendar/components/conflict-resolution-sheet.tsx` — Novo componente
- `src/features/calendar/components/conflict-resolution-sheet.test.tsx` — 12 testes unitarios
- `src/features/calendar/components/event-card.tsx` — Adicionado `onConflictClick` prop + button wrapper
- `src/features/calendar/components/event-card.test.tsx` — Estendido com `describe('EventCard conflict click')` (4 testes)
- `src/features/calendar/components/day-detail-sheet.tsx` — Adicionado `onConflictClick` handler
- `src/features/calendar/components/calendar-grid-client.tsx` — Renderizacao do ConflictResolutionSheet
- `e2e/conflict-resolution-sheet.spec.ts` — 3 cenarios E2E Playwright

### Change Log

- 2026-05-12: Story 4.1 implemented — ConflictResolutionSheet with WhatsApp/Instagram deep links, store-driven integration, 22 ATDD scenarios covered
