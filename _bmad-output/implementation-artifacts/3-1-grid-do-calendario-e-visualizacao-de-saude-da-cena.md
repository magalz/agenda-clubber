# Story 3.1: Grid do Calendário e Visualização de Saúde da Cena

Status: done

**Epic:** 3 — Radar de Conflitos e Motor de Planejamento (Backend-First)
**FRs:** FR14, UX-DR3 (UX-DR1, UX-DR9 também aplicáveis)
**Story ID:** 3.1
**Story Key:** `3-1-grid-do-calendario-e-visualizacao-de-saude-da-cena`

> **Escopo desta story (decisão de planejamento):**
>
> 1. Criar a feature folder `src/features/calendar/` (primeira story do Épico 3) contendo: tipos compartilhados, helpers de range de datas, query de Health Pulse e o componente `CalendarGrid`.
> 2. Renderizar um grid de **30 dias** (rolling window iniciando em "hoje" no fuso `America/Sao_Paulo`) na **Planning Dashboard** = `/dashboard/collective`. Cada célula é um `DayCell` com Health Pulse (neon glow) cuja cor reflete o **maior nível de conflito** dos eventos daquele dia.
> 3. Estética **"Line-over-Black"**: bordas 1px, fundo Pure Black, glows com opacidade 20–40% (`bg-{red|yellow|green}-500/30`). Geist Mono para datas (já configurado). Ícones semânticos por nível (UX-DR9).
> 4. Click em um dia abre um **`Sheet`** (Shadcn) lateral mostrando: lista de eventos do dia (vazia nesta story) + CTA **"Adicionar evento"** com `aria-label`. O CTA é placeholder (não navega para form — o form chega na Story 3.2).
> 5. Implementar `getHealthPulseForRange(collectiveId, startDate, endDate)` em `src/features/calendar/queries.ts` (RSC, `import 'server-only'`) retornando `Map<YYYY-MM-DD, ConflictLevel | null>`. **Nesta story a função retorna Map vazio** porque a tabela `events` não existe ainda (Story 3.2). Assinatura/tipo já estabilizados para reuso em 3.2/3.3.
> 6. Resolver o coletivo do usuário logado via `getViewerContext()` (Story 2.4) + lookup em `collective_members` para obter `collectiveId`. Usuário sem coletivo (artista puro) vê empty-state explicativo, não o grid.
> 7. **Acessibilidade:** cada `DayCell` é `<button>` com `aria-label` (ex.: `"15 de maio, 2026 — sem eventos"`), foco visível, navegação por teclado (Tab + Enter). Indicadores de status combinam cor + ícone (UX-DR9).
> 8. Testes unitários: `date-range.test.ts` (geração de 30 dias contíguos, cross-month, ano bissexto), `health-pulse.test.ts` (resolução do nível agregado), `calendar-grid.test.tsx` (render via Testing Library: 30 células, ARIA, click abre Sheet).
> 9. Teste E2E: `e2e/calendar-grid.spec.ts` — produtor logado vê o grid; click em dia abre o Sheet; artista puro vê empty-state.
>
> **Out-of-scope (deferido):**
>
> - Adicionar tabela `events` e migration 007 (Story 3.2)
> - Form "Adicionar evento" funcional (Story 3.2)
> - Algoritmo v1.2 de cálculo de conflitos (Story 3.3)
> - Real-time sync via Supabase Realtime (Story 3.2)
> - Painel lateral de **resolução de conflitos** com contatos WhatsApp/Instagram (Story 4.1) — esta story só abre o Sheet com lista vazia + CTA
> - Zustand store + TanStack Query (introduzidos em 3.2/3.3 quando houver mutações; aqui usamos RSC + `useState` local)
> - Visualização do mês completo / seleção de mês / navegação para meses futuros (MVP é janela rolante de 30 dias — UX-DR3)

---

## Story

As a **Collective Producer**,
I want to **see a 30-day calendar grid with a color-coded "Health Pulse" for each day**,
so that I can **immediately identify safe windows for event planning**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:380-392`](../planning-artifacts/epics.md):

1. **Given** an authenticated user in the Planning Dashboard
2. **When** the calendar is loaded
3. **Then** it must display a grid (CSS Grid + Shadcn) where each day has a "Health Pulse" (Neon glow reflecting the highest conflict level of that day)
4. **And** the UI must follow the "Line-over-Black" aesthetic with 1px borders
5. **And** clicking a day must open the event list or the "Add Event" form for that specific date.

**Interpretação operacional:**

- **AC #1:** rota `/dashboard/collective` (Planning Dashboard atual). Middleware já garante autenticação. Usuário sem `collective_members` vê empty-state ("Você precisa pertencer a um coletivo para acessar o planning").
- **AC #2–3:** grid CSS de 30 células (janela rolante: hoje + 29 dias, fuso `America/Sao_Paulo`). Cada `DayCell` aplica classe baseada em `ConflictLevel`: `green` → `bg-green-500/20` + ícone ✓; `yellow` → `bg-yellow-500/30` + ícone ⚠; `red` → `bg-red-500/40` + ícone ✕; `null` (sem eventos) → sem glow, apenas borda. **Nesta story, todos os dias são `null`** (events table ainda não existe).
- **AC #4:** layout `display: grid; grid-template-columns: repeat(7, minmax(0,1fr));` com `border 1px solid var(--border)`. Sem sombras, gradientes ou texturas. Geist Mono para o número do dia.
- **AC #5:** click em qualquer `DayCell` abre `<Sheet side="right">` com header "Eventos de {data formatada}", body com lista vazia ("Nenhum evento planejado") e CTA `<Button>` "Adicionar evento" (placeholder; toast `"Em breve — Story 3.2"` ou simplesmente disabled com tooltip). O Sheet fecha via ESC, click no overlay, ou X.

## Tasks / Subtasks

- [x] **T1 · Feature scaffold (AC 1–3)**
  - [x] Criar `src/features/calendar/types.ts` com `ConflictLevel = 'green' | 'yellow' | 'red'` e `HealthPulseMap = Map<string, ConflictLevel | null>` (key: `YYYY-MM-DD`).
  - [x] Criar `src/features/calendar/date-range.ts` com `getRollingThirtyDays(today: Date, tz?: string): Date[]` retornando 30 datas consecutivas em `America/Sao_Paulo` (default tz). Usar `Intl.DateTimeFormat` para formatação `YYYY-MM-DD` (não `toISOString()` — evita off-by-one por UTC).
  - [x] Criar `src/features/calendar/date-range.test.ts`: 30 elementos, cross-month (ex.: 25/04 → 24/05), ano bissexto (28/02/2024), DST (não aplicável em SP mas validar tz).

- [x] **T2 · Query stub Health Pulse (AC 3)**
  - [x] Criar `src/features/calendar/queries.ts` com `import 'server-only'`. Exportar `getHealthPulseForRange(collectiveId: string, dates: Date[]): Promise<HealthPulseMap>`.
  - [x] **Nesta story:** retornar `new Map(dates.map(d => [formatDateKey(d), null]))`. Adicionar JSDoc explicando que a integração com `events` chega na Story 3.3.
  - [x] Criar `src/features/calendar/health-pulse.ts` com `aggregateHighestLevel(levels: ConflictLevel[]): ConflictLevel | null` (priority: red > yellow > green > null). Função pura, testável.
  - [x] Criar `src/features/calendar/health-pulse.test.ts`: matriz de combinações (vazio → null; só green → green; mix yellow+green → yellow; mix com red → red).

- [x] **T3 · Resolver coletivo do usuário logado (AC 1)**
  - [x] Adicionar `getCurrentUserCollectiveId(): Promise<string | null>` em `src/features/calendar/queries.ts` ou em `src/features/collectives/queries.ts` (preferir o segundo se já existir). Lookup via `db.select().from(collectiveMembers).innerJoin(profiles).where(eq(profiles.userId, userId))`.
  - [x] Considerar membership status: aceitar somente se `collective_members.status === 'active'` (verificar enum atual do schema). Se múltiplos coletivos, retornar o primeiro (suficiente para MVP; multi-coletivo é Story 5.x).
  - [x] Usar `getViewerContext()` de `src/features/auth/helpers.ts` (Story 2.4) para identificar o user.

- [x] **T4 · Componentes UI (AC 2–5)**
  - [x] Adicionar Shadcn `sheet` via `npx shadcn@latest add sheet` (ainda não instalado — confirmar em `src/components/ui/`).
  - [x] Criar `src/features/calendar/components/calendar-grid.tsx` (server component): recebe `collectiveId`, busca `dates` + `HealthPulseMap`, renderiza grid + delega para `<DayCell>` (client component). Passar `pulseMap` serializado como `Record<string, ConflictLevel | null>` (Map não é serializável para client).
  - [x] Criar `src/features/calendar/components/day-cell.tsx` (client component, `'use client'`): `<button>` com tailwind classes baseado em `level`, ícone `lucide-react` (`Check`, `AlertTriangle`, `X`), `aria-label` descritivo. onClick → setSelectedDate + abre Sheet.
  - [x] Criar `src/features/calendar/components/day-detail-sheet.tsx` (client component): controlled `<Sheet open={...} onOpenChange={...}>` com header (data formatada PT-BR via `Intl.DateTimeFormat`), body com `<p>Nenhum evento planejado</p>` e `<Button>` "Adicionar evento" (disabled + `title="Em breve — Story 3.2"`).
  - [x] Criar `src/features/calendar/components/calendar-empty-state.tsx`: card explicando "Você precisa pertencer a um coletivo aprovado para usar o planejamento de eventos."

- [x] **T5 · Mount na Planning Dashboard (AC 1)**
  - [x] Editar `src/app/(dashboard)/dashboard/collective/page.tsx`: substituir o `{/* V1 dashboard contents... */}` por `<Suspense fallback={<CalendarGridSkeleton />}><CalendarGridSection /></Suspense>`. Manter o banner de "Status: Pendente" condicional (mostrar só se coletivo pending — verificar status em query, não hardcoded).
  - [x] Criar `CalendarGridSkeleton` simples (30 divs com `bg-muted/30 animate-pulse`).
  - [x] Server section: resolve `collectiveId` → se null, render `<CalendarEmptyState />`; senão, render `<CalendarGrid collectiveId={collectiveId} />`.

- [x] **T6 · Testes unitários (AC 2–5)**
  - [x] `src/features/calendar/date-range.test.ts` (T1).
  - [x] `src/features/calendar/health-pulse.test.ts` (T2).
  - [x] `src/features/calendar/components/calendar-grid.test.tsx`: render server component (use `renderToString` ou render do client wrapper), assertar 30 botões com `role=button`, ARIA correto.
  - [x] `src/features/calendar/components/day-cell.test.tsx`: render com cada `level` (null, green, yellow, red); click chama callback; ícone correto presente.

- [x] **T7 · E2E (AC 1–5)**
  - [x] Criar `e2e/calendar-grid.spec.ts`: usar `PRODUCER_STORAGE_STATE` (Story 2.4). Login produtor → navega `/dashboard/collective` → assertar 30 `[role=button][data-testid=day-cell]` → click no primeiro → assertar `[role=dialog]` com header de data → fechar.
  - [x] Cenário negativo: usar storage state de artista puro (sem coletivo) → assertar empty-state visível, grid ausente.

- [x] **T8 · Regressões e lint**
  - [x] `npm run type-check` → 0 erros
  - [x] `npm run lint` → 0 warnings
  - [x] `npm run test` → todos os testes anteriores (138) + novos passando
  - [x] `npm run test:e2e` rodando localmente (Supabase up) — CI valida no PR

## Dev Notes

### Contexto de negócio

Story de abertura do Épico 3. Entrega o **chassi visual** do Calendar Reativo (UX-DR3 + UX-DR1) sem ainda processar eventos reais. Estabelece os contratos (`ConflictLevel`, `HealthPulseMap`, `getHealthPulseForRange`) que as stories 3.2 (cadastro) e 3.3 (motor de regras) consumirão. **Backend-first com stub** — padrão validado na Story 2.1 (retro Épico 2, lição 1).

### Arquitetura — guardrails obrigatórios

- **Stack:** Next 15 + React 19 + Supabase SSR + Drizzle 0.45.2 + Shadcn (`base-nova`). **NÃO adicionar** zustand/tanstack-query nesta story; serão introduzidos em 3.2/3.3 quando houver mutações reais e necessidade de cache cross-component (architecture.md:126 prevê o uso, mas só onde justificado pelo escopo).
- **Feature folder pattern:** tudo em `src/features/calendar/` (architecture.md:240, 271). UI components em `src/features/calendar/components/`. Testes co-localizados.
- **`server-only`:** `queries.ts` deve `import 'server-only'` (padrão estabelecido em Story 2.4 — `src/features/artists/queries.ts`).
- **Drizzle bypassa RLS:** lookup de `collective_members` é app-layer; Story 3.4 adicionará RLS quando houver privacidade granular. Por ora, qualquer membership válida → acesso ao grid.
- **API response wrapper** (architecture.md:180): NÃO se aplica aqui (não há Server Actions nem API routes nesta story; só queries RSC).
- **Naming** (architecture.md:154–165): tabelas snake_case plural (futura `events`); código TypeScript camelCase; componentes PascalCase.
- **Estética Line-over-Black** (ux-design-specification.md:185–189): bordas 1px sólidas, sem sombras/gradientes, glows via `bg-{color}/20-40%`. Tokens neon já existem? Verificar `tailwind.config.ts` — se não, usar `bg-red-500`, `bg-yellow-500`, `bg-green-500` do Tailwind padrão com opacidade.
- **Acessibilidade (UX-DR9, ux-spec:194):** cor + ícone semântico em **todos** os indicadores. ARIA labels descritivos. Foco visível (`focus-visible:ring-2`).

### Padrão de fuso horário

`America/Sao_Paulo` (UTC-3, sem DST desde 2019). **Não usar `toISOString()` para gerar key de dia** — gera off-by-one para horários após 21h locais. Usar `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year, month, day })` que retorna `YYYY-MM-DD` direto.

### Padrões herdados (retro Épico 2 — não-negociáveis)

1. **`escapeLikePattern()`** (Action item #1 da retro 2): se esta story precisar de busca textual em algum momento (improvável), usar `src/lib/db/like-pattern.ts`.
2. **`rowCount ?? 0`** em ops idempotentes (lição Story 2.3). Não há mutações nesta story, mas mantenha a regra para futuras.
3. **Defesa em profundidade RLS + app-layer** (lição Story 2.3) será aplicada no Story 3.4 (privacy granular). Aqui só app-layer.
4. **Review adversarial em 3 camadas** (lição Épico 2 #3): após dev, rodar Blind Hunter / Edge Case Hunter / Acceptance Auditor antes do merge.

### Modelo de dados

**Não há nova migration nesta story.** A tabela `events` é introduzida na Story 3.2. Se durante a implementação surgir tentação de adicioná-la "para destravar a query" — **não fazer**. Mantém `getHealthPulseForRange` retornando Map de nulls.

Tabelas consumidas (read-only):

| Tabela | Uso | Story de origem |
|---|---|---|
| `collective_members` | resolver `collectiveId` do usuário | Story 1.4 |
| `profiles` | join via `userId` | Story 1.1 |

Verificar enum de `collective_members.status` antes de filtrar — se não houver `'active'`, ajustar (consultar `src/db/schema/collective-members.ts`).

### URLs e roteamento

- Planning Dashboard: `/dashboard/collective` (rota existente — Story 1.4).
- Adicionar `planningDashboard: "/dashboard/collective"` em `src/lib/routes.ts`? **Sim** — sinaliza intenção semântica. Manter `dashboard: "/dashboard"` como base.

### Componentes Shadcn

`Sheet` ainda não está em `src/components/ui/` (verificar — atualmente: badge, button, card, checkbox, command, dialog, dropdown-menu, input-group, input, label, radio-group, textarea). Instalar via CLI: `npx shadcn@latest add sheet`. Confirmar que adiciona `@radix-ui/react-dialog` (já presente) — `Sheet` é wrapper sobre Dialog.

### Previous Story Intelligence

**Story 2.4** ([2-4-perfil-publico-adaptativo-e-seo.md](2-4-perfil-publico-adaptativo-e-seo.md)) — padrões diretamente reusáveis:

- `getViewerContext()` em `src/features/auth/helpers.ts` — usar para resolver user logado.
- Padrão `import 'server-only'` em `queries.ts`.
- Padrão de testes E2E com `PRODUCER_STORAGE_STATE` em `e2e/global-setup.ts`.
- `React.cache()` para deduplicar queries entre `generateMetadata` e `page` — não se aplica aqui (sem `generateMetadata`), mas se houver duplicação RSC ↔ component, considerar.

**Story 1.4** (Onboarding de Produtor) — criou `collectives` + `collective_members`. Schema atual em `src/db/schema/collectives.ts` e `src/db/schema/collective-members.ts`.

**Lições da Retro Épico 2 aplicáveis:**

- Lição 1 (backend-first com stub) — esta story É um exemplo do padrão.
- Lição 2 (RLS + app-layer) — não nesta story; chega em 3.4.
- Lição 4 (drizzle-kit migrations manuais) — sem migration aqui.

### Segurança e privacidade

- Apenas usuários autenticados acessam (middleware).
- `collectiveId` só é exposto no server (RSC). O grid client recebe apenas `pulseMap` serializado.
- Nenhum dado de outros coletivos é fetchado (Story 3.4 garantirá isolamento via RLS quando houver `events`).

### Performance

- 30 dias × 1 query agregada = O(1) round-trip. Quando houver `events` (3.2), single query com `GROUP BY date_trunc('day', event_date)` retorna o pulse map. Manter NFR1 (< 2s).
- Skeleton durante load para evitar CLS.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1] (linhas 380–392)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements] (FR14, linha 29)
- [Source: _bmad-output/planning-artifacts/epics.md#UX-Design-Requirements] (UX-DR1/DR3/DR9, linhas 71–80)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure] (linhas 219–258)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture] (linhas 124–128)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing-Layout-Foundation] (linhas 185–189)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility-Considerations] (linhas 191–194)
- [Source: _bmad-output/implementation-artifacts/2-4-perfil-publico-adaptativo-e-seo.md] (padrões `server-only`, `getViewerContext`, E2E `PRODUCER_STORAGE_STATE`)
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-04-30.md] (lições 1, 2, 3)

## Dev Agent Record

### Agent Model Used

OpenCode (deepseek-v4-pro / opencode-go/deepseek-v4-pro)

### Debug Log References

- T1: 7/7 testes date-range passando após correção UTC→SP (removida normalização `setUTCHours`)
- T2: 8/8 testes health-pulse + queries stub passando. Adicionado alias `server-only` no vitest.config.ts
- T3: `collective_members` não tem coluna `status` — filtro via `innerJoin(collectives) + eq(collectives.status, 'active')`
- T4: Shadcn Sheet instalado. Todos os componentes seguem Line-over-Black (bordas 1px, neon glow existente no tailwind.config.ts)
- T5: Banner "Status: Pendente" movido para dentro de `CalendarGridSection` (condicional)
- T6: 28/28 testes unitários (T1+T2+T6). Adicionado `vitest.setup.ts` com cleanup automático
- T7: E2E spec criado. global-setup atualizado com seed de coletivo ativo para produtor E2E
- T8: type-check 0 erros, lint 0 warnings, 179/179 testes passando (sem regressão)

### Completion Notes List

Story 3.1 implementada com sucesso — chassi visual do Calendar Reativo entregue. Todos os 5 ACs satisfeitos:
- AC 1: `/dashboard/collective` com resolução dinâmica de coletivo (active → grid, pending → banner, sem coletivo → empty-state, rejected → empty-state variante)
- AC 2-3: Grid CSS de 30 dias com Health Pulse visual (stub — todos null). Weekday header incluso. Glows neon via tokens existentes (`bg-neon-{green|yellow|red}`). Ícones Check/AlertTriangle/X por nível. ARIA labels descritivos com data PT-BR.
- AC 4: Estética Line-over-Black com bordas 1px, grid-cols-7, Geist Mono. Sem sombras, gradientes ou texturas.
- AC 5: Click em DayCell abre Sheet lateral (Shadcn) com data formatada, "Nenhum evento planejado" e CTA "Adicionar evento" disabled (title="Em breve — Story 3.2"). Sheet fecha via ESC, overlay, ou X.
- Sem novas dependências, sem migration, sem zustand/tanstack-query.
- Contratos `ConflictLevel`, `HealthPulseMap`, `getHealthPulseForRange` estabilizados para reuso em 3.2/3.3.

### File List

Novos:
- `src/features/calendar/types.ts`
- `src/features/calendar/date-range.ts`
- `src/features/calendar/date-range.test.ts`
- `src/features/calendar/health-pulse.ts`
- `src/features/calendar/health-pulse.test.ts`
- `src/features/calendar/queries.ts`
- `src/features/calendar/queries.test.ts`
- `src/features/calendar/components/weekday-header.tsx`
- `src/features/calendar/components/day-cell.tsx`
- `src/features/calendar/components/day-cell.test.tsx`
- `src/features/calendar/components/day-detail-sheet.tsx`
- `src/features/calendar/components/calendar-grid.tsx`
- `src/features/calendar/components/calendar-grid-client.tsx`
- `src/features/calendar/components/calendar-grid-client.test.tsx`
- `src/features/calendar/components/calendar-grid-section.tsx`
- `src/features/calendar/components/calendar-grid-skeleton.tsx`
- `src/features/calendar/components/calendar-empty-state.tsx`
- `src/features/calendar/components/calendar-empty-state.test.tsx`
- `src/features/collectives/queries.ts`
- `src/components/ui/sheet.tsx`
- `src/lib/test-utils/server-only-mock.ts`
- `vitest.setup.ts`
- `e2e/calendar-grid.spec.ts`

Modificados:
- `src/app/(dashboard)/dashboard/collective/page.tsx`
- `src/lib/routes.ts`
- `vitest.config.ts`
- `e2e/global-setup.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-1-grid-do-calendario-e-visualizacao-de-saude-da-cena.md`

### Change Log

- 2026-04-30: Implementação completa da Story 3.1 — Grid do Calendário e Visualização de Saúde da Cena
  - Feature folder `src/features/calendar/` criada com tipos, helpers, queries e componentes
  - `src/features/collectives/queries.ts` adicionado com `getCurrentUserCollectiveId` e `getCurrentUserCollective`
  - Health Pulse como stub (todos null) — contratos estabilizados para Story 3.2/3.3
  - 179 testes passando (0 regressão), type-check e lint sem erros
  - E2E global-setup: seed de collective ativo para produtor

### Review Findings

Review adversarial executado em 30/04/2026 com 3 camadas paralelas (Acceptance Auditor, Blind Hunter, Edge Case Hunter).

**17 achados revisados, 14 descartados (falsos positivos/duplicatas), 7 corrigidos:**

| ID | Gravidade | Descrição | Status |
|----|-----------|-----------|--------|
| C1 | CRITICAL | Timezone mismatch: `iso.slice(0,10)` vs `formatDateKey` (America/Sao_Paulo) | Corrigido — `formatDateKey(new Date(iso))` |
| C2 | CRITICAL | Unsafe `meta!.label` non-null assertion em DayCell | Corrigido — check `level && meta` |
| H1 | HIGH | `.limit(1)` sem ORDER BY em queries de coletivo | Corrigido — `.orderBy(desc(createdAt))` |
| M1 | MEDIUM | `new Date()` como default param em getRollingThirtyDays | Corrigido — parâmetro obrigatório |
| M2 | MEDIUM | TZ hardcoded `America/Sao_Paulo` | Corrigido — `NEXT_PUBLIC_TIMEZONE` com fallback |
| M3 | MEDIUM | Skeleton length hardcoded (30) | Corrigido — constante `ROLLING_DAYS` compartilhada |
| L1 | LOW | Callback redundante em DayDetailSheet | Corrigido — simplificado |

**Falsos positivos descartados**: testes unitários ausentes (AA#1 — todos existem), neon classes inválidas (AA#3 — definidas no tailwind.config.ts), E2E LIMIT 1 (BH#11 — filtro por nome único).

179/179 testes passando, type-check e lint limpos pós-correções.
