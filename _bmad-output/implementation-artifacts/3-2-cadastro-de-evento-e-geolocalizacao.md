# Story 3.2: Cadastro de Evento e Geolocalização

Status: ready-for-dev

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

- [ ] **T1 · Schema + Migration (AC 4–6)**
  - [ ] Criar `src/db/schema/events.ts` com tabela `events`:
    - `id: uuid().defaultRandom().primaryKey()`
    - `collectiveId: uuid().references(() => collectives.id, { onDelete: 'cascade' }).notNull()`
    - `name: text().notNull()`
    - `eventDate: date('event_date').notNull()`
    - `eventDateUtc: timestamp('event_date_utc', { withTimezone: true }).notNull()`
    - `locationName: text('location_name').notNull()`
    - `latitude: numeric('latitude', { precision: 10, scale: 7 })`
    - `longitude: numeric('longitude', { precision: 10, scale: 7 })`
    - `timezone: text('timezone')` — IANA string (ex: `America/Sao_Paulo`)
    - `genrePrimary: text('genre_primary').notNull()`
    - `lineup: jsonb('lineup')` — `string[]`
    - `status: text('status', { enum: ['planning', 'confirmed'] }).default('planning').notNull()`
    - `isNamePublic: boolean('is_name_public').default(true).notNull()`
    - `isLocationPublic: boolean('is_location_public').default(false).notNull()`
    - `isLineupPublic: boolean('is_lineup_public').default(false).notNull()`
    - `createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }).notNull()`
    - `createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()`
    - `updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date())`
  - [ ] Criar `src/db/schema/events.test.ts` — assertar todas as colunas
  - [ ] Gerar migration: `npx drizzle-kit generate` → `supabase/migrations/0008_events.sql`
  - [ ] Executar migration: `npx drizzle-kit migrate`
  - [ ] Atualizar `src/db/index.ts`:
    - Importar `* as events from './schema/events'`
    - Adicionar `...events` ao schema do drizzle

- [ ] **T2 · Tipos estendidos (AC 7)**
  - [ ] Em `src/features/calendar/types.ts`, adicionar:
    ```ts
    export type DayPulse = { level: ConflictLevel | null; hasEvents: boolean };
    export type HealthPulseRecord = Record<string, DayPulse>;

    export interface CalendarEvent {
      id: string;
      name: string;
      eventDate: string; // YYYY-MM-DD
      locationName: string;
      genrePrimary: string;
      lineup: string[];
      status: 'planning' | 'confirmed';
      isNamePublic: boolean;
      isLocationPublic: boolean;
      isLineupPublic: boolean;
      createdAt: string;
    }
    ```
  - [ ] Atualizar `HealthPulseMap` para usar `DayPulse` como value (ou manter compatibilidade e adicionar `HealthPulseRecord`)
  - [ ] **Decisão:** `ConflictLevelRecord` existente fica como está para o grid (só a cor). Adicionar `HealthPulseRecord` separado com `hasEvents`. Converter no serialization boundary (server → client).

- [ ] **T3 · Validação Zod (AC 3–4)**
  - [ ] Criar `src/features/calendar/validations.ts`:
    ```ts
    import { z } from 'zod';

    export const GENRE_OPTIONS = [
      'Techno', 'House', 'Drum and Bass', 'Trance', 'Progressive House',
      'Minimal', 'Tech House', 'Deep House', 'Hard Techno', 'Melodic Techno',
      'Breaks', 'Jungle', 'UK Garage', 'Disco', 'Funk',
    ] as const;

    export const eventFormSchema = z.object({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
      location: z.string().min(2, 'Local é obrigatório').max(500),
      genre: z.enum(GENRE_OPTIONS, { required_error: 'Selecione um gênero' }),
      lineup: z.array(z.string().max(200)).max(50).default([]),
    });

    export type EventFormInput = z.infer<typeof eventFormSchema>;
    ```
  - [ ] Validar Zod v4 (já instalado — `"zod"` não está no package.json! Verificar se está como peer dep do `drizzle-orm` ou instalar explicitamente). **Adicionar `zod` ao `package.json` se necessário.**

- [ ] **T4 · Serviço de Geolocalização (AC 5)**
  - [ ] Criar `src/features/calendar/map.ts` (server-only):
    ```ts
    import 'server-only';

    export interface GeocodedPlace {
      lat: number;
      lng: number;
      displayName: string;
    }

    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
    const USER_AGENT = 'AgendaClubber/1.0 (magal@agendaclubber.com)';

    /** Resolves a location string to coordinates via Nominatim (OSM). */
    export async function geocode(query: string): Promise<GeocodedPlace | null> {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 0 }, // no cache
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.length) return null;
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }

    /** Post-MVP: autocomplete via Photon.
     * export async function searchPlaces(query: string): Promise<GeocodedPlace[]> { ... }
     */
    ```
  - [ ] Resolver timezone em Server Action (não em `map.ts` — `tz-lookup` é ESM-only e incompatível com `'use server'` bundling? Testar. Se falhar, usar API REST Open-Meteo como fallback: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&timezone=auto` (campo `timezone` no response). Alternativa: criar API Route para timezone).
  - [ ] **Decisão arquitetural final:** Se `tz-lookup` não funcionar em Server Action, usar Open-Meteo REST (gratuito, sem API key):
    ```ts
    async function resolveTimezone(lat: number, lng: number): Promise<string> {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&current_weather=false`);
      const data = await res.json();
      return data.timezone ?? 'America/Sao_Paulo';
    }
    ```

- [ ] **T5 · Server Actions (AC 4–6)**
  - [ ] Criar `src/features/calendar/actions.ts`:
    ```ts
    'use server';

    import { db } from '@/db';
    import { events } from '@/db/schema/events';
    import { eventFormSchema } from './validations';
    import { geocode } from './map';
    import { getViewerContext } from '@/features/auth/helpers';
    import { revalidatePath } from 'next/cache';
    ```
  - [ ] `createEvent(input: EventFormInput)`:
    1. Autenticar via `getViewerContext()` — se não autenticado, `{ error: { message: 'Não autorizado', code: 'UNAUTHORIZED' } }`
    2. Resolver `collectiveId` via `getCurrentUserCollectiveId()` (de `@/features/collectives/queries`) — se sem coletivo ativo, error.
    3. Validar `eventFormSchema.safeParse(input)` — se inválido, `{ error: { message, code: 'VALIDATION_ERROR' } }`
    4. Geocodificar: `const place = await geocode(input.location)` — se null, salvar sem lat/lng (não bloquear — local pode ser genérico)
    5. Resolver timezone: se `place`, chamar `resolveTimezone(place.lat, place.lng)`. Fallback: `'America/Sao_Paulo'`
    6. Calcular UTC: `const eventDateUtc = new Date(input.eventDate + 'T00:00:00').toISOString()` (a data é local date string — converter para UTC requer timezone. Usar `new Date(input.eventDate + 'T00:00:00')` com offset do timezone resolvido — ou armazenar como `date` no DB que não tem timezone, e armazenar `event_date_utc` como `timestamptz` calculado: `const utc = new Date(input.eventDate + 'T12:00:00-03:00').toISOString()` com offset do timezone)
    7. Inserir no DB: `const [event] = await db.insert(events).values({...}).returning()`
    8. `revalidatePath('/dashboard/collective')` — invalida cache RSC
    9. Retornar `{ data: event }`
  - [ ] `updateEvent(eventId: string, input: Partial<EventFormInput>)`:
    - Verificar ownership (created_by === viewer.profileId)
    - Atualizar campos permitidos
    - Re-geocodificar se location mudou
  - [ ] Adicionar `src/features/calendar/__tests__/actions.test.ts`:
    - Testar `createEvent` com input válido → retorna `data`
    - Testar `createEvent` com input inválido → `error.code === 'VALIDATION_ERROR'`
    - Testar `createEvent` sem autenticação → `UNAUTHORIZED`
    - Testar `updateEvent` de outro criador → error

- [ ] **T6 · Zustand Store + TanStack Query (AC 6)**
  - [ ] Instalar deps: `npm install zustand @tanstack/react-query`
  - [ ] Criar `src/features/calendar/store.ts`:
    ```ts
    import { create } from 'zustand';
    import type { CalendarEvent } from './types';

    interface CalendarStore {
      selectedDate: Date | null;
      isSheetOpen: boolean;
      events: CalendarEvent[];
      setSelectedDate: (date: Date | null) => void;
      setEvents: (events: CalendarEvent[]) => void;
      addEvent: (event: CalendarEvent) => void;
      removeEvent: (id: string) => void;
    }

    export const useCalendarStore = create<CalendarStore>((set) => ({
      selectedDate: null,
      isSheetOpen: false,
      events: [],
      setSelectedDate: (date) => set({ selectedDate: date, isSheetOpen: date !== null }),
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }));
    ```
  - [ ] Criar `src/features/calendar/hooks.ts`:
    ```ts
    'use client';

    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    import { createClient } from '@/lib/supabase/client';
    import type { CalendarEvent } from './types';

    // Fetch events for a collective date range
    export function useEvents(collectiveId: string, startDate: string, endDate: string) {
      return useQuery({
        queryKey: ['events', collectiveId, startDate, endDate],
        queryFn: async () => {
          const res = await fetch(`/api/events?collectiveId=${collectiveId}&start=${startDate}&end=${endDate}`);
          if (!res.ok) throw new Error('Failed to fetch events');
          return res.json() as Promise<{ data: CalendarEvent[] }>;
        },
        enabled: !!collectiveId,
      });
    }

    // Supabase Realtime subscription
    export function useEventRealtime(collectiveId: string) {
      const queryClient = useQueryClient();

      useEffect(() => {
        if (!collectiveId) return;
        const supabase = createClient();
        const channel = supabase
          .channel(`events:${collectiveId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'events',
            filter: `collective_id=eq.${collectiveId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['events', collectiveId] });
          })
          .subscribe();
        return () => { supabase.removeChannel(channel); };
      }, [collectiveId, queryClient]);
    }
    ```
  - [ ] Configurar `QueryClientProvider` no layout root:
    - Criar `src/lib/react-query/provider.tsx` (client component com `QueryClientProvider`)
    - Importar e mountar em `src/app/layout.tsx` (ou `(dashboard)/layout.tsx`)
  - [ ] **NÃO usar** Zustand diretamente para server state — apenas para UI state (selectedDate, isSheetOpen). Server state = TanStack Query.

- [ ] **T7 · Componentes UI — EventForm + Sheet atualizado (AC 1–4, 6)**
  - [ ] Instalar shadcn `select` se não existir: `npx shadcn@latest add select`
  - [ ] Instalar shadcn `toast` (sonner ou shadcn toast): `npx shadcn@latest add sonner`
  - [ ] Criar `src/features/calendar/components/event-form.tsx` (client component):
    - Props: `selectedDate: Date`, `onSuccess: () => void`
    - Estado local: form fields + `isSubmitting` + `serverError`
    - Usar `useMutation` do TanStack Query para chamar `createEvent`
    - Campos:
      - `<Input>` para nome (required, `aria-required`)
      - `<Label>` exibindo data formatada PT-BR (pre-preenchida, readonly)
      - `<Input>` para local (required)
      - `<Select>` para gênero (opções de `GENRE_OPTIONS`)
      - `<Textarea>` para line-up (um artista por linha, split `\n`)
    - Botão submit: `"Salvar evento"` com loading state (`isSubmitting` → spinner + disabled)
    - Erro de validação: exibir abaixo do campo (igual `<p className="text-red-500 text-sm">`)
    - Erro de servidor: toast de erro + mensagem inline
    - Sucesso: toast "Evento criado", `onSuccess()` → fecha Sheet
    - Acessibilidade: `aria-label` nos inputs, `role="alert"` nos erros, foco no primeiro campo ao abrir
  - [ ] Atualizar `src/features/calendar/components/day-detail-sheet.tsx`:
    - Remover `<p>Nenhum evento planejado</p>` e `<Button disabled>Adicionar evento</Button>`
    - Renderizar lista de eventos do dia (se houver) + `<EventForm selectedDate={date} onSuccess={() => onOpenChange(false)} />`
    - Se dia sem eventos: `<p className="text-muted-foreground text-sm mb-4">Nenhum evento planejado.</p>` + `<EventForm />`
  - [ ] Atualizar `src/features/calendar/components/calendar-grid-client.tsx`:
    - Envolver em provider TanStack Query (se o provider não estiver no layout)
    - Integrar `useCalendarStore` para `selectedDate`/`isSheetOpen` (substituir `useState`)
    - Adicionar `useEventRealtime(collectiveId)` para subscription
    - Passar `collectiveId` como prop (recebido do server component)

- [ ] **T8 · Health Pulse real (AC 7)**
  - [ ] Atualizar `src/features/calendar/queries.ts`:
    - Substituir stub de `getHealthPulseForRange` por query real:
      ```ts
      import { db } from '@/db';
      import { events } from '@/db/schema/events';
      import { sql, and, gte, lte, eq } from 'drizzle-orm';
      import { formatDateKey } from './date-range';

      export async function getHealthPulseForRange(
        collectiveId: string,
        dates: Date[]
      ): Promise<HealthPulseMap> {
        const start = dates[0];
        const end = dates[dates.length - 1];
        const rows = await db
          .select({
            eventDate: events.eventDate,
            count: sql<number>`count(*)::int`,
          })
          .from(events)
          .where(
            and(
              eq(events.collectiveId, collectiveId),
              gte(events.eventDate, formatDateKey(start)),
              lte(events.eventDate, formatDateKey(end))
            )
          )
          .groupBy(events.eventDate);

        const countByDate = new Map(rows.map(r => [r.eventDate, r.count]));

        return new Map(dates.map(d => {
          const key = formatDateKey(d);
          const eventCount = countByDate.get(key) ?? 0;
          // Story 3.2: presence signal only; conflict level = null for all days
          return [key, null]; // manutenção: value é ConflictLevel | null (compatível com DayCell)
        }));
      }
      ```
    - **NOTA:** O tipo de retorno permanece `HealthPulseMap = Map<string, ConflictLevel | null>` para compatibilidade com `DayCell` e `CalendarGrid`. O `hasEvents` será inferido via `level !== null || count > 0` no client se necessário. Mas nesta story, `DayCell` só renderiza a cor, então manter `null` para todos é suficiente.
  - [ ] Atualizar `queries.test.ts` para testar query real (requer mock do DB ou teste de integração):
    - Alternativa: manter teste unitário do stub e adicionar teste de integração separado em `__tests__/queries.integration.test.ts`

- [ ] **T9 · API Route para events (opcional — para TanStack Query)**
  - [ ] Avaliar necessidade: se `useEvents` hook usar Server Action em vez de API Route, não precisa. Mas TanStack Query espera uma Promise-based fetcher. Server Actions funcionam via `useMutation` mas não são ideais para `useQuery`.
  - [ ] **Abordagem recomendada:** Criar `src/app/api/events/route.ts` (GET) que aceita `collectiveId`, `start`, `end` como query params e retorna `{ data: CalendarEvent[] }`. Usar o client Supabase para auth (cookies).
  - [ ] OU usar RSC para passar dados iniciais e TanStack Query com `initialData`:
    ```ts
    // calendar-grid.tsx (RSC)
    const events = await getEventsForRange(collectiveId, dates);
    return <CalendarGridClient events={events} ... />
    ```
    No client: usar `events` como `initialData` no `useQuery` e Realtime para updates incrementais. **Esta abordagem mantém o padrão RSC + Realtime sem API Route extra.**
  - [ ] **Decisão:** Usar RSC + initialData (sem API Route). O hook `useEvents` recebe `initialEvents` e o Realtime invalida a query — mas como não há endpoint, substituir por `useEffect` que escuta Realtime + merges localmente na store Zustand.

- [ ] **T10 · Testes (AC 1–7)**
  - [ ] `src/features/calendar/validations.test.ts`: testar `eventFormSchema`
    - input válido mínimo (só nome + data + local + gênero)
    - nome vazio → erro
    - nome < 3 chars → erro
    - data inválida → erro
    - gênero inválido → erro
  - [ ] `src/features/calendar/__tests__/map.test.ts`: testar `geocode` (mock fetch)
    - query válida → retorna `GeocodedPlace`
    - query sem resultado → null
    - erro de rede → null (graceful degradation)
  - [ ] `src/features/calendar/__tests__/actions.test.ts` (ver T5)
  - [ ] `src/features/calendar/components/event-form.test.tsx`:
    - Renderiza campos obrigatórios (nome, local, gênero)
    - Exibe data pre-preenchida formatada
    - Submissão com campos vazios → erros de validação
    - Submissão válida → chama `createEvent` (mockado), toast de sucesso
    - `aria-required` no campo nome
    - `aria-label` nos inputs
  - [ ] Atualizar `src/features/calendar/components/day-cell.test.tsx`:
    - Verificar que click ainda abre Sheet (comportamento existente)
  - [ ] Atualizar `src/features/calendar/components/calendar-grid-client.test.tsx`:
    - Verificar que Sheet mostra EventForm quando aberto (não mais o botão disabled)
  - [ ] `src/features/calendar/__tests__/queries.integration.test.ts` (opcional — se ambiente de teste integração disponível):
    - Inserir evento → `getHealthPulseForRange` retorna Map com a data key
  - [ ] `e2e/event-registration.spec.ts`:
    - Usar `PRODUCER_STORAGE_STATE` (produtor com coletivo ativo do seed)
    - Navegar para `/dashboard/collective`
    - Clicar em um DayCell → Sheet abre
    - Verificar que o Sheet contém formulário (não mais botão disabled)
    - Preencher nome, local, selecionar gênero
    - Submeter → evento salvo, Sheet fecha, toast de sucesso
    - Reabrir o mesmo dia → Sheet mostra o evento na lista

- [ ] **T11 · Seed E2E e regressões**
  - [ ] Atualizar `e2e/global-setup.ts`:
    - Seed de evento para o produtor E2E (opcional — útil para testar a lista)
  - [ ] `npm run type-check` → 0 erros
  - [ ] `npm run lint` → 0 warnings
  - [ ] `npm run test` → todos os testes (179 atuais) + novos passando
  - [ ] `npm run test:e2e` → spec `event-registration.spec.ts` passa

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Change Log

### Review Findings
