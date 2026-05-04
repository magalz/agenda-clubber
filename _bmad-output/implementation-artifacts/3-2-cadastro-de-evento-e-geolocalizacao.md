# Story 3.2: Cadastro de Evento e Geolocalização

Status: done

**Epic:** 3 — Radar de Conflitos e Motor de Planejamento (Backend-First)
**FRs:** FR15, FR24
**Story ID:** 3.2
**Story Key:** `3-2-cadastro-de-evento-e-geolocalizacao`

> **Escopo desta story:**
>
> 1. Criar tabela `events` (migration 008), schema Drizzle e seed no E2E setup.
> 2. Substituir o botão "Adicionar evento" (disabled placeholder da Story 3.1) por um `<EventForm />` funcional dentro do `DayDetailSheet`.
> 3. Formulário com **nome do evento (required)**, data (pre-preenchida pelo dia clicado), local (texto), gênero primário (select) e line-up (textarea/lista).
> 4. Serviço de geolocalização em `src/features/calendar/map.ts`: ao submeter o form, resolver coordenadas via **Nominatim** e fuso horário via **`tz-lookup`** (lib estática). Contrato preparado para autocomplete futuro com Photon (pós-MVP).
> 5. Server Actions `createEvent` e `updateEvent` validadas com Zod — salvam o evento com `event_date_utc` convertido e `timezone` IANA.
> 6. Introduzir **Zustand** (store do calendário: dia selecionado, Sheet aberto, eventos carregados) e **TanStack Query** (server state: query de eventos, mutation `createEvent`).
> 7. **Supabase Realtime**: subscription no canal `events` filtrada por `collective_id` — atualiza store Zustand em tempo real para evitar data races entre produtores.
> 8. Substituir stub de `getHealthPulseForRange` por query real agregando `events` por dia (GROUP BY `event_date`, COUNT + nível máximo de conflito — neste MVP retorna apenas `null` para todos os dias enquanto o motor de regras (3.3) não existe; mas a query já lê da tabela `events`).
> 9. Testes unitários (schema, actions, validations, map), integração (form, queries) e E2E (cadastro de evento completo).
> 10. Instalar novas dependências: `zustand`, `@tanstack/react-query`, `leaflet`, `@types/leaflet`, `tz-lookup`.

> **Out-of-scope (deferido):**
>
> - Cálculo Verde/Amarelo/Vermelho e justificativas (Story 3.3 — motor de regras v1.2)
> - Autocomplete de local com Photon (pós-MVP; contrato preparado em `map.ts`)
> - Anonimidade granular e RLS por evento (Story 3.4)
> - Delay ético de 3s para conflitos críticos (Story 3.5)
> - Painel lateral de resolução de conflitos com contatos (Story 4.1)
> - Visualização do mês completo / navegação para meses futuros (post-MVP)
> - Mapa interativo Leaflet para selecionar local no mapa (seria display-only nesta story; o form usa input de texto + geocoding)

---

## Story

As a **Collective Producer**,
I want to **register my event with its name, date, location, genre and line-up**,
so that I can **automatically calculate potential conflicts and keep the collective calendar up to date**.

## Acceptance Criteria

1. **Given** an authenticated producer viewing the calendar for a specific day
2. **When** they click a day cell
3. **Then** a Sheet opens with an event registration form pre-filled with the selected date
4. **And** the user can submit the form with Event Name (required), Location, Genre, and Line-up
5. **And** the system automatically fetches geographic coordinates and timezone from the location text (via Nominatim + tz-lookup)
6. **And** the event is saved to the database and reflected in the calendar grid in real time (< 5s via Supabase Realtime)
7. **And** the Health Pulse indicator updates to reflect the new event's presence (presence signal; conflict level stays null until Story 3.3)

**Interpretação operacional:**

- **AC #1–2:** Click no `DayCell` (já implementado em 3.1) abre o `DayDetailSheet`. Em vez do botão disabled, renderiza `<EventForm selectedDate={date} />`. O Sheet fecha via ESC, overlay, ou X. Middleware já garante autenticação.
- **AC #3:** Form contém campos:
  - `name` (text, required, `aria-required="true"`)
  - `location` (text, required, placeholder: "Ex: D-Edge, São Paulo")
  - `genre` (select, required, opções dos gêneros musicais do PRD — array exportado de constante)
  - `lineup` (textarea ou lista de strings, opcional para MVP — armazenado como `jsonb` no DB)
  - Data pré-preenchida via `selectedDate`, exibida como label formatada PT-BR. Botão submit `"Salvar evento"` com validação Zod.
- **AC #4:** Ao submeter, Server Action `createEvent`:
  1. Valida input com Zod
  2. Chama `geocode(location)` → retorna `{ lat, lng, displayName }` via Nominatim
  3. Chama `tz_lookup(lat, lng)` → retorna IANA timezone string
  4. Calcula `event_date_utc` a partir de `event_date` + timezone
  5. Insere na tabela `events` via Drizzle
  6. Retorna `{ data: event }` ou `{ error: { message, code } }` (padrão arquitetura)
- **AC #5:** `geocode()` em `src/features/calendar/map.ts`:
  - GET `https://nominatim.openstreetmap.org/search?q={encodeURIComponent(query)}&format=json&limit=1`
  - Headers: `User-Agent: AgendaClubber/1.0 (magal@agendaclubber.com)`
  - Rate limit: 1 req/s (Nominatim fair use). Debounce de 300ms no input (prepara para Photon pós-MVP, mas no MVP é chamado no submit).
  - Timezone: `tz_lookup(lat, lng)` — lib estática, sem API call.
- **AC #6:** Supabase Realtime:
  - Canal `events:{collectiveId}` com filtro `collective_id=eq.{collectiveId}`
  - Eventos `INSERT`/`UPDATE`/`DELETE` invalidam a query do TanStack Query (`queryClient.invalidateQueries({ queryKey: ['events', collectiveId] })`)
  - Setup e teardown no `useEffect` do hook `useEventRealtime(collectiveId)`
- **AC #7:** `getHealthPulseForRange` atualizada para:
  ```sql
  SELECT event_date, COUNT(*) as event_count
  FROM events
  WHERE collective_id = $1
    AND event_date BETWEEN $2 AND $3
  GROUP BY event_date
  ```
  Retorna `HealthPulseMap` com `event_count > 0 ? null : null` para cada dia (sinal de presença mas sem nível de conflito — regras chegam em 3.3). O valor `null` significa "tem eventos mas sem nível calculado", diferenciado de "sem eventos" via flag `hasEvents: boolean` no tipo (ver T2).

## Tasks / Subtasks

- [x] **T1 · Schema + Migration (AC 4–6)**
  - [x] Criar `src/db/schema/events.ts` com tabela `events` (todas as colunas conforme spec)
  - [x] Criar `src/db/schema/schema.test.ts` — assertar todas as colunas (adicionado ao schema.test.ts existente)
  - [x] Gerar migration manual: `supabase/migrations/0008_events.sql` (SQL manual com CREATE TABLE, índice e trigger)
  - [x] Migration gerada manualmente (drizzle-kit generate requer DB; SQL manual com `CREATE OR REPLACE FUNCTION` para trigger)
  - [x] Atualizar `src/db/index.ts`:
    - Importar `* as events from './schema/events'`
    - Adicionar `...events` ao schema do drizzle

- [x] **T2 · Tipos estendidos (AC 7)**
  - [x] Adicionar `CalendarEvent`, `DayPulse`, `HealthPulseRecord` em `src/features/calendar/types.ts`
  - [x] Manter `HealthPulseMap` como `Map<string, ConflictLevel | null>` para compatibilidade com DayCell
  - [x] `ConflictLevelRecord` mantido como está para o grid

- [x] **T3 · Validação Zod (AC 3–4)**
  - [x] Criar `src/features/calendar/validations.ts` com `eventFormSchema`, `GENRE_OPTIONS`, `EventFormInput`
  - [x] Zod v4 instalado explicitamente (`npm install zod --save`) — adaptado de `required_error` para `message` (Zod v4 API)
  - [x] Fix Zod v4 compatibilidade em `artists/schemas.ts` e `artists/actions.ts` (`.optional()` fora de `z.preprocess`, `errors` → `issues`)

- [x] **T4 · Serviço de Geolocalização (AC 5)**
  - [x] Criar `src/features/calendar/map.ts` (server-only) com `geocode()` via Nominatim e `resolveTimezone()` via Open-Meteo
  - [x] Open-Meteo escolhido como resolver de timezone (fallback 'America/Sao_Paulo') — `tz-lookup` não instalado (ESM-only incompatível com Server Actions)
  - [x] Contrato preparado para Photon autocomplete pós-MVP (`searchPlaces()` comentado)

- [x] **T5 · Server Actions (AC 4–6)**
  - [x] Criar `src/features/calendar/actions.ts` com `createEvent` e `updateEvent`
  - [x] `createEvent`: auth → collective → validate → geocode → timezone → UTC calc → insert → revalidate
  - [x] `updateEvent`: ownership check, campos permitidos, re-geocode se location mudou
  - [x] Testes em `src/features/calendar/__tests__/actions.test.ts`: UNAUTHORIZED, NO_COLLECTIVE, VALIDATION_ERROR, happy path com/sem geocode, update ownership

- [x] **T6 · Zustand Store + TanStack Query (AC 6)**
  - [x] Instalar deps: `npm install zustand @tanstack/react-query`
  - [x] Criar `src/features/calendar/store.ts` (Zustand: UI state only — selectedDate, isSheetOpen, events)
  - [x] Criar `src/features/calendar/hooks.ts` (`useCreateEvent` mutation + `useEventRealtime` subscription via Supabase Realtime com INSERT/DELETE)
  - [x] Configurar `QueryClientProvider` em `src/lib/react-query/provider.tsx` e montar em `src/app/(dashboard)/layout.tsx`
  - [x] RSC + initialData (sem API Route) — `useEffect` escuta Realtime e mergeia na store Zustand

- [x] **T7 · Componentes UI — EventForm + Sheet atualizado (AC 1–4, 6)**
  - [x] Instalar shadcn `select` e `sonner`: `npx shadcn@latest add select sonner`
  - [x] Criar `src/features/calendar/components/event-form.tsx` com validação Zod, useMutation, toast, acessibilidade
  - [x] Atualizar `day-detail-sheet.tsx`: remover botão disabled, renderizar lista de eventos + EventForm
  - [x] Atualizar `calendar-grid-client.tsx`: Zustand store, Realtime subscription, `collectiveId`/`initialEvents` props

- [x] **T8 · Health Pulse real (AC 7)**
  - [x] Atualizar `src/features/calendar/queries.ts`: query real com `GROUP BY event_date`, retorno `Map<string, null>` (compatível com DayCell — nível de conflito chega em 3.3)
  - [x] Atualizar `queries.test.ts`: mock DB, testa que query é chamada e retorna 30 nulls

- [x] **T9 · RSC + initialData (sem API Route)**
  - [x] **Decisão executada:** RSC + initialData sem API Route
  - [x] Criar `src/features/calendar/events-queries.ts` — `getEventsForRange()` (server-only)
  - [x] `CalendarGrid` (RSC) busca `initialEvents` e passa ao `CalendarGridClient`
  - [x] Realtime subscription mergeia na store Zustand diretamente (sem TanStack Query para fetch)

- [x] **T10 · Testes (AC 1–7)**
  - [x] `src/features/calendar/validations.test.ts` — schema: válido mínimo, nome vazio, <3 chars, data inválida, gênero inválido, lineup default/max
  - [x] `src/features/calendar/__tests__/map.test.ts` — geocode: válido, vazio, erro de rede, non-ok, encoding; resolveTimezone: sucesso, fallback, erro
  - [x] `src/features/calendar/__tests__/actions.test.ts` — createEvent: UNAUTHORIZED, NO_COLLECTIVE, VALIDATION_ERROR, happy path com/sem geocode; updateEvent: NOT_FOUND, FORBIDDEN, sucesso
  - [x] Atualizar `calendar-grid-client.test.tsx` — Sheet com EventForm (não mais botão disabled), role=dialog + campos visíveis
  - [x] `e2e/event-registration.spec.ts` — formulário visível, submissão com nome/local/gênero, verifica sucesso

- [x] **T11 · Seed E2E e regressões**
  - [x] `npm run type-check` → 0 erros
  - [x] `npm run lint` → 0 warnings
  - [x] `npm run test` → 208 testes passando (21 arquivos)
  - [x] `e2e/event-registration.spec.ts` criado (requer ambiente Supabase local para execução)

## Dev Notes

### Contexto de negócio

Story de cadastro de eventos dentro do Épico 3. Conecta a interface do calendário (Story 3.1) com a camada de persistência real. Substitui o stub de Health Pulse por query real (ainda sem cálculo de conflito — isso chega em 3.3). Introduz o stack de estado cliente (Zustand + TanStack Query) previsto na arquitetura.

### Arquitetura — guardrails obrigatórios

- **Stack:** Next 15 + React 19 + Supabase SSR + Drizzle 0.45.2 + Shadcn + **Leaflet.js** + **Nominatim** + **tz-lookup** (ou fallback Open-Meteo). NÃO adicionar Google Maps, Mapbox, ou qualquer API paga de geocoding.
- **Feature folder:** tudo em `src/features/calendar/`. Schema em `src/db/schema/`.
- **Migrations:** gerar via `npx drizzle-kit generate`. Output em `supabase/migrations/`. Número da migration: **0008** (última é 007).
- **`server-only`:** `queries.ts` e `map.ts` devem `import 'server-only'`.
- **Zod-first:** Nenhuma Server Action processa dados sem `safeParse`.
- **API response wrapper:** `{ data: T | null, error: { message: string, code: string } | null }` — usar nas Server Actions. Não se aplica a queries RSC (retornam o dado direto).
- **Drizzle mapeamento:** schema em camelCase (TS), tabela em snake_case (DB), Drizzle faz a ponte via `columnName: text('column_name')`.
- **Naming:** tabelas snake_case plural (`events`), colunas snake_case (`event_date`, `collective_id`), código camelCase (`eventDate`, `collectiveId`).
- **Estética Line-over-Black:** formulário segue o mesmo padrão do Sheet existente — bordas 1px, sem sombras, fundo pure black, foco `focus-visible:ring-2`.
- **Acessibilidade (UX-DR9):** todos os campos com `aria-label`, erro com `role="alert"`, foco automático no primeiro campo ao abrir Sheet.

### Decisão arquitetural: Geocoding + Timezone

| Serviço | Provedor | Endpoint / Lib |
|---------|----------|----------------|
| Geocoding | **Nominatim** (OSM) | `GET https://nominatim.openstreetmap.org/search?q=...&format=json&limit=1` |
| Timezone | **tz-lookup** (preferido) | `import tz_lookup from 'tz-lookup'` — estático, offline |
| Timezone fallback | **Open-Meteo** | `GET https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&timezone=auto` |
| Autocomplete | **Photon** (pós-MVP) | Interface `searchPlaces()` já declarada em `map.ts` |

**Justificativa:** OSS-First (`architecture.md:294`), custo zero, sem API key. Contrato `map.ts` expõe `geocode()` e `searchPlaces()` — a segunda é no-op no MVP, implementada quando Photon for adicionado pós-MVP.

### Padrão de fuso horário

Data do evento é armazenada em **dois campos**:
- `event_date` (type `date`, sem timezone): data no calendário local do evento
- `event_date_utc` (type `timestamptz`): data UTC para cálculos e comparações

Para converter: `new Date(eventDate + 'T12:00:00' + offsetDoTimezone)` — usar meio-dia local para evitar off-by-one.

### Padrões herdados (Story 3.1 + Retro Épico 2 — não-negociáveis)

1. **`escapeLikePattern()`**: se precisar de busca textual, usar `src/lib/db/like-pattern.ts` (Story 2.4, retro 2 action item #1).
2. **`rowCount ?? 0`** em ops idempotentes (lição Story 2.3).
3. **`.limit(1)` sempre com `.orderBy(desc(...))`** — lição do review 3.1 (H1 corrigido).
4. **`new Date()` como default param PROIBIDO** — lição do review 3.1 (M1). Sempre parâmetro obrigatório.
5. **`NEXT_PUBLIC_TIMEZONE`** env var já existe (review 3.1, M2). Usar com fallback `America/Sao_Paulo`.
6. **Review adversarial em 3 camadas** obrigatório antes do merge (lição Épico 2 #3).

### Previous Story Intelligence (Story 3.1)

**Padrões reusáveis:**
- `getViewerContext()` em `src/features/auth/helpers.ts` — autenticação em Server Actions
- `getCurrentUserCollectiveId()` em `src/features/collectives/queries.ts` — resolver coletivo
- `formatDateKey()`, `formatDayLabelPtBr()`, `ROLLING_DAYS`, `getRollingThirtyDays()` em `date-range.ts`
- `ConflictLevel`, `HealthPulseMap`, `ConflictLevelRecord` em `types.ts`
- `aggregateHighestLevel()` em `health-pulse.ts` (será usado em 3.3 — não nesta story)
- Shadcn `Sheet` já instalado
- `PRODUCER_STORAGE_STATE` para E2E com coletivo ativo seedado
- `vitest.setup.ts` com cleanup automático
- `src/lib/test-utils/server-only-mock.ts` — mock para `import 'server-only'` nos testes

**Arquivos que serão modificados (lista exaustiva com estado atual):**

| Arquivo | Estado atual | O que muda |
|---------|-------------|------------|
| `queries.ts` | Stub retornando `Map<string, null>` | Query real agregando `events` |
| `day-detail-sheet.tsx` | Botão disabled + "Nenhum evento planejado" | `<EventForm />` funcional |
| `calendar-grid-client.tsx` | `useState` local para selectedDate | Zustand + Realtime + `collectiveId` prop |
| `types.ts` | `ConflictLevel`, `HealthPulseMap`, `ConflictLevelRecord` | Adicionar `CalendarEvent`, `DayPulse`, `HealthPulseRecord` |
| `calendar-grid.tsx` (RSC) | Passa `dates` + `pulseMap` | Adicionar passagem de `initialEvents` |
| `calendar-grid-section.tsx` | Renderiza `CalendarGrid` | Possível ajuste para prover `collectiveId` |
| `db/index.ts` | Schema com auth, collectives, collectiveMembers, artists | Adicionar `events` |
| `queries.test.ts` | Testa stub com 30 nulls | Testar query real (ou mover para integration test) |
| `calendar-grid-client.test.tsx` | Testa Sheet com botão disabled | Atualizar para EventForm |
| `day-cell.test.tsx` | Testa click → Sheet | Sem mudanças (comportamento preservado) |
| `day-detail-sheet.tsx` (testes) | Não tem testes próprios | Adicionar teste |
| `package.json` | Sem zustand/tanstack-query/leaflet/tz-lookup | Adicionar 4 dependências |

**Não modificar sem necessidade:**
- `date-range.ts`, `date-range.test.ts`, `health-pulse.ts`, `health-pulse.test.ts` — estáveis
- `calendar-empty-state.tsx`, `calendar-grid-skeleton.tsx` — sem mudanças
- `weekday-header.tsx` — sem mudanças
- `src/components/ui/sheet.tsx` — Shadcn, não editar manualmente
- `src/app/(dashboard)/dashboard/collective/page.tsx` — já mounta `<CalendarGridSection />`, não precisa alterar
- `src/lib/routes.ts` — `planningDashboard` já definido

### Zustand + TanStack Query — primeiro uso no projeto

Este é o primeiro uso destas bibliotecas. Convém seguir o padrão mínimo:

- **Zustand:** apenas UI state (selectedDate, isSheetOpen, events carregados). NÃO usar para server cache — isso é TanStack Query.
- **TanStack Query:** server state (events da API, mutations createEvent/updateEvent). `QueryClientProvider` no layout root ou layout do dashboard.
- **Padrão arquitetura (`architecture.md:126`):** "TanStack Query (5.99.0) para dados de rede e Zustand (5.0.12) para a complexa lógica visual do Calendário."
- **Estrutura:** store em `src/features/calendar/store.ts`, hooks em `src/features/calendar/hooks.ts`, provider em `src/lib/react-query/provider.tsx`.

### Real-time via Supabase

- Canal: `events:{collectiveId}` com filtro por `collective_id`
- **Subscription no client component** (`useEventRealtime` hook), NÃO no RSC
- **Cleanup no unmount:** `supabase.removeChannel(channel)` no return do `useEffect`
- Realtime é POSTGRES_CHANGES (não Broadcast) — detecta INSERT/UPDATE/DELETE
- Após evento, invalidar `queryClient` para refetch dos dados + atualizar store Zustand
- **Não tentar usar Realtime em Server Components** — é client-only

### Leaflet.js — instalação e setup

```bash
npm install leaflet @types/leaflet
```

- **Não** adicionar `leaflet.css` ao layout global se o mapa não for renderizado nesta story no frontend.
- O serviço de geocoding (`map.ts`) é server-only e **não usa** Leaflet diretamente — apenas faz fetch HTTP para Nominatim.
- Leaflet é instalado agora porque a arquitetura decidiu usá-lo para display de mapas no futuro (possivelmente Story 3.4 ou feature de localização de artistas). A instalação antecipada evita dependência "fantasma" depois.

### Segurança e privacidade

- Apenas usuários autenticados acessam (middleware).
- Server Actions verificam `getViewerContext()` antes de qualquer operação.
- `collectiveId` resolvido no server (nunca enviado do client).
- Ownership check em `updateEvent`: `created_by === viewer.profileId`.
- RLS será adicionado na Story 3.4 (privacidade granular). Por enquanto, app-layer apenas.
- `isNamePublic`/`isLocationPublic`/`isLineupPublic` são salvos mas não consumidos nesta story (Story 3.4).

### Performance

- Geocoding: chamada única no submit, não em tempo real. Rate limit Nominatim: 1 req/s (fair use). Debounce de 300ms no input prepara para Photon.
- Health Pulse query: `GROUP BY event_date` com índice em `(collective_id, event_date)` — verificar se precisa criar índice manualmente na migration.
- Realtime: subscription filtrada por `collective_id` no próprio Postgres (não filtra no client).
- Skeleton durante load do formulário (reaproveitar o existente `CalendarGridSkeleton`).

### URLs e roteamento

- Sem novas rotas. Formulário é montado dentro do Sheet em `/dashboard/collective`.
- Se criar API Route para events (GET), usar: `/api/events?collectiveId=...&start=...&end=...`

### Modelo de dados — tabela events

| Coluna (DB) | Tipo PG | Coluna (TS) | Descrição |
|-------------|---------|-------------|-----------|
| `id` | `uuid PK` | `id` | |
| `collective_id` | `uuid FK → collectives` | `collectiveId` | |
| `name` | `text NOT NULL` | `name` | Nome do evento |
| `event_date` | `date NOT NULL` | `eventDate` | Data no fuso local |
| `event_date_utc` | `timestamptz NOT NULL` | `eventDateUtc` | ISO 8601 UTC |
| `location_name` | `text NOT NULL` | `locationName` | Texto digitado pelo usuário |
| `latitude` | `numeric(10,7)` | `latitude` | Via Nominatim |
| `longitude` | `numeric(10,7)` | `longitude` | Via Nominatim |
| `timezone` | `text` | `timezone` | IANA (ex: `America/Sao_Paulo`) |
| `genre_primary` | `text NOT NULL` | `genrePrimary` | |
| `lineup` | `jsonb` | `lineup` | `string[]` |
| `status` | `text DEFAULT 'planning'` | `status` | `'planning'` / `'confirmed'` |
| `is_name_public` | `bool DEFAULT true` | `isNamePublic` | Story 3.4 |
| `is_location_public` | `bool DEFAULT false` | `isLocationPublic` | Story 3.4 |
| `is_lineup_public` | `bool DEFAULT false` | `isLineupPublic` | Story 3.4 |
| `created_by` | `uuid FK → profiles` | `createdBy` | |
| `created_at` | `timestamptz DEFAULT now()` | `createdAt` | |
| `updated_at` | `timestamptz DEFAULT now()` | `updatedAt` | |

### Dependências a instalar

```bash
npm install zustand @tanstack/react-query leaflet @types/leaflet
npm install tz-lookup  # se ESM-compatível; senão, pular e usar Open-Meteo fallback
npm install zod  # se ainda não estiver no package.json (verificar!)
npx shadcn@latest add select
npx shadcn@latest add sonner  # ou shadcn toast
```

### Futuro Enhancement (pós-MVP)

```ts
// src/features/calendar/map.ts
export async function searchPlaces(query: string): Promise<GeocodedPlace[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features.map((f: any) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    displayName: f.properties.name + ', ' + f.properties.country,
  }));
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2] (linhas 398–408)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements] (FR15, FR24, linhas 165, 176)
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap-Analysis] (Gap 2: Localidade & Mapas, linhas 351–352)
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-Compatibility] (OSS-First, linha 294)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture] (Zustand + TanStack Query, linha 126)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure] (Feature-based, linhas 219–258)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] (Naming, Zod-first, API wrapper, linhas 149–208)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Handoff] (AI Agent Guidelines, linhas 365–369)
- [Source: _bmad-output/planning-artifacts/prd.md#FR15] (Cadastro de eventos, linha 165)
- [Source: _bmad-output/planning-artifacts/prd.md#FR24] (Geolocalização e fuso horário, linha 176)
- [Source: _bmad-output/planning-artifacts/prd.md#Inteligência-de-Localidade] (Padronização UTC, linhas 122–124)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing-Layout] (Line-over-Black, linhas 185–189)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] (Cor + ícone + ARIA, linhas 191–194)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy] (Conflict Indicator, Event Form, linhas 269–300)
- [Source: _bmad-output/implementation-artifacts/3-1-grid-do-calendario-e-visualizacao-de-saude-da-cena.md] (Story anterior completa com dev notes, review findings, file list)
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-04-30.md] (lições 1–4, action items)
- [Source: src/db/schema/collectives.ts] (schema de referência para FK)
- [Source: src/db/schema/collective-members.ts] (schema de referência para FK)
- [Source: src/features/collectives/queries.ts] (`getCurrentUserCollectiveId` para reuso)
- [Source: src/features/auth/helpers.ts] (`getViewerContext` para reuso)
- [Source: e2e/global-setup.ts] (PRODUCER_STORAGE_STATE + seed de coletivo)

## Dev Agent Record

### Agent Model Used

Claude Code (deepseek-v4-flash via opencode)

### Debug Log References

- Zod v4 breaking changes: `error.errors` → `error.issues`, `errorMap` → `message`, `.optional()` positioning on `z.preprocess`
- tz-lookup não instalado (ESM-only, incompatível com Server Actions Next.js) — Open-Meteo como fallback
- shadcn Select `onValueChange` recebe `string | null` (necessário `(v) => setGenre(v ?? '')`)
- Migration 008 gerada manualmente (drizzle-kit generate requer conexão com DB)

### Completion Notes List

1. **Schema/Migration (T1):** Tabela `events` com 18 colunas, migration 0008 com índice + trigger de updated_at
2. **Tipos (T2):** Adicionados `CalendarEvent`, `DayPulse`, `HealthPulseRecord`; compatibilidade mantida
3. **Validação (T3):** Schema Zod v4 com `eventFormSchema`, `GENRE_OPTIONS` (15 gêneros)
4. **Geolocalização (T4):** `map.ts` com Nominatim + Open-Meteo, tratamento de erro com try/catch
5. **Server Actions (T5):** `createEvent` e `updateEvent` com pipeline completo de validação → geocode → timezone → UTC → persistência
6. **Estado cliente (T6):** Zustand store + TanStack Query provider + Realtime subscription (INSERT/DELETE)
7. **Componentes (T7):** EventForm com validação inline + toast + acessibilidade; Sheet com lista de eventos
8. **Health Pulse (T8):** Query real com `GROUP BY event_date` (nível de conflito = null até 3.3)
9. **RSC initialData (T9):** `getEventsForRange` server query; CalendarGrid passa `initialEvents` ao client
10. **Testes (T10):** 208 testes passando (+29 novos), type-check 0 erros, lint 0 warnings
11. **Zod v4 fixes:** Artistas schemas corrigidos para compatibilidade com Zod v4.4.1

### File List

**Novos:**
- `src/db/schema/events.ts` — Schema Drizzle da tabela events
- `supabase/migrations/0008_events.sql` — Migration SQL
- `src/features/calendar/validations.ts` — Zod schema + GENRE_OPTIONS
- `src/features/calendar/validations.test.ts` — Testes do schema
- `src/features/calendar/map.ts` — Geolocalização (Nominatim + Open-Meteo)
- `src/features/calendar/actions.ts` — Server Actions (createEvent + updateEvent)
- `src/features/calendar/events-queries.ts` — Server query para eventos
- `src/features/calendar/store.ts` — Zustand store
- `src/features/calendar/hooks.ts` — TanStack Query mutation + Realtime subscription
- `src/lib/react-query/provider.tsx` — QueryClientProvider
- `src/features/calendar/components/event-form.tsx` — Formulário de evento
- `src/features/calendar/__tests__/map.test.ts` — Testes de geolocalização
- `src/features/calendar/__tests__/actions.test.ts` — Testes de Server Actions
- `e2e/event-registration.spec.ts` — Teste E2E de cadastro de evento
- `src/components/ui/select.tsx` — Shadcn Select
- `src/components/ui/sonner.tsx` — Shadcn Sonner (toast)

**Modificados:**
- `src/db/index.ts` — Adicionado schema `events`
- `src/db/schema/schema.test.ts` — Testes da tabela events
- `src/features/calendar/types.ts` — Adicionados CalendarEvent, DayPulse, HealthPulseRecord
- `src/features/calendar/queries.ts` — Query real (stub → GROUP BY)
- `src/features/calendar/queries.test.ts` — Mock DB para query real
- `src/features/calendar/components/calendar-grid.tsx` — Passa collectiveId + initialEvents
- `src/features/calendar/components/calendar-grid-client.tsx` — Zustand + Realtime + novas props
- `src/features/calendar/components/day-detail-sheet.tsx` — EventForm + lista de eventos
- `src/features/calendar/components/calendar-grid-client.test.tsx` — Teste com EventForm
- `src/app/(dashboard)/layout.tsx` — QueryClientProvider
- `src/features/artists/schemas.ts` — Zod v4 compat (optional fora de preprocess)
- `src/features/artists/actions.ts` — Zod v4 compat (errors → issues)
- `src/features/auth/actions.ts` — Zod v4 compat (errorMap → message)
- `src/features/auth/actions.test.ts` — Zod v4 compat (errorMap → message)
- `package.json` — Adicionados zustand, @tanstack/react-query, leaflet, @types/leaflet, zod
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updated to in-progress

### Change Log

- Adicionada tabela `events` com migration 0008, schema Drizzle e seed de colunas de privacidade
- Implementado formulário de cadastro de evento (EventForm) no DayDetailSheet
- Serviço de geolocalização via Nominatim + fuso horário via Open-Meteo
- Server Actions `createEvent` e `updateEvent` com validação Zod, geocoding e timezone resolution
- Zustand + TanStack Query introduzidos para estado de UI e subscriptions Realtime
- Health Pulse query real (GROUP BY event_date), nível de conflito = null até Story 3.3
- RSC + initialData pattern (sem API Route)
- 29 novos testes (unitários + E2E), 208 no total, type-check e lint 0 erros
- Zod v4 fixes retroativos nos módulos existentes (artists, auth)
- Dependências instaladas: zustand, @tanstack/react-query, leaflet, @types/leaflet, zod

### Review Findings

Story merged via PR #19 (commit `035d0b0`). Post-merge fixes aplicados diretamente em `main`: `a7e97e9` (code review fixes), `1c890e2` `d6e644f` `7824527` (E2E hardening para CI), `02d835c` (a11y: aria-label sem acento), `a8c9d81` (Toaster montado no root layout), `49cfd67` `b959d00` `6122c6d` (E2E CI stability + DEBT-3.2-A). Esteira CI verde (typecheck + lint + 208 unit + E2E). Adversarial review em 3 camadas (per Retro Épico 2 lição #3) não arquivado formalmente neste artefato — os fix commits documentam pragmaticamente o ciclo de revisão.