# Story 3.3: Motor de Regras Algoritmo v1.2

Status: ready-for-dev

**Epic:** 3 — Radar de Conflitos e Motor de Planejamento (Backend-First)
**FRs:** FR21, FR22 (atende NFR1 < 2s)
**Story ID:** 3.3
**Story Key:** `3-3-motor-de-regras-algoritmo-v1-2`

> **Escopo desta story:**
>
> 1. Criar o **Conflict Engine** isolado em `src/features/calendar/logic/` (architecture.md:271) com regras puras testáveis e um orquestrador `server-only` que faz I/O.
> 2. Implementar a **versão completa do Algoritmo v1.2** conforme `prd.md:133-136`: três famílias de regras (mesmo gênero, mesmo artista não-local, saturação de artistas locais).
> 3. Persistir `conflict_level` (`'green'|'yellow'|'red'|null`) e `conflict_justification` (text) na tabela `events` via migration **009**. Defaults seguros (`null`).
> 4. Hookar o engine em `createEvent` e `updateEvent`: após `INSERT`/`UPDATE`, computar o nível do evento atual + **recomputar todos os vizinhos afetados** (mesma janela de 15 dias) na **mesma transação** Drizzle. Trade-off escolhido: writes mais pesados, reads triviais (decisão Q5 do plano).
> 5. Substituir o stub de `getHealthPulseForRange` (que hoje devolve `null` em todos os dias) por uma agregação real: `GROUP BY event_date` com `MAX(conflict_level)` resolvido pela função pura `aggregateHighestLevel()` já existente (`health-pulse.ts`, herdada da Story 3.1).
> 6. Surfacing de FR22 na UI: `DayDetailSheet` exibe um **dot colorido** + a **justificativa em PT-BR** ao lado do nome de cada evento na lista. Sem novos componentes, sem novas rotas.
> 7. Cobertura de testes obrigatória: matriz exaustiva nos limites (3↔4, 7↔8, 15↔16 dias); regras puras testadas em isolamento; testes de integração para `createEvent`/`updateEvent` (persistência + neighbor recompute); E2E cross-collective (`conflict-detection.spec.ts`).
> 8. Estender `e2e/global-setup.ts` com **`OTHER_COLLECTIVE_STORAGE_STATE`** + seed de evento conflitante para validar detecção real cross-collective.
> 9. Server Action mantida (não Edge Function) — decisão Q6 do plano. Architecture.md só obriga Edge para webhooks; consistency com 3.2 vence.
> 10. Atualizar `MEMORY.md` com a nova decisão de matching de artistas (string-normalizada) e o gap "lineup ↔ artists FK" como tech debt rastreado.
>
> **Out-of-scope (deferido):**
>
> - Botão de confirmação com delay ético de 3s para conflitos VERMELHOS → **Story 3.5**
> - Painel lateral de resolução de conflitos com contatos WhatsApp/Instagram → **Story 4.1**
> - Notificações por e-mail para RED/YELLOW → **Story 4.2**
> - RLS para `events` (privacidade granular) → **Story 3.4** — esta story lê cross-collective via Drizzle (que bypassa RLS), e isso é deliberado e documentado
> - Marcação bilateral "Resolvido" que força GREEN → **Story 4.4**
> - FK linkando `lineup` (jsonb de strings) à tabela `artists` (id) — fica como tech debt; matching agora é string-normalizado
> - Refatoração para Vercel Edge Runtime — Server Action é suficiente

---

## Story

As a **Producer**,
I want **the system to calculate the technical impact of my event automatically**,
so that **I can receive objective feedback on conflict levels**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:413-420`](../planning-artifacts/epics.md):

1. **Given** a new or edited event
2. **When** the backend (Edge Functions) evaluates the input
3. **Then** it must return **RED** if: Same genre within 3 days OR Same non-local artist within 7 days
4. **And** it must return **YELLOW** if: Same genre within 4-7 days OR Same non-local artist within 8-15 days
5. **And** it must return **GREEN** otherwise
6. **And** a text justification (e.g., "Conflito: Mesmo gênero em janela de 48h") must be provided

> **Nota de fidelidade ao spec:** o épico só lista 2 famílias de regras (gênero + artista não-local). O **PRD § Algoritmo de Detecção de Choque (v1.2)** ([`prd.md:133-136`](../planning-artifacts/prd.md)) lista uma 3ª família: **saturação de artistas locais** (3+ artistas locais na mesma data → RED, 2 artistas locais → YELLOW). Por decisão de planejamento (Q2 do plano), o PRD é a fonte de verdade — esta story implementa as 3 famílias.

> **Nota sobre "Edge Functions" no AC #2:** o épico usa o termo literal, mas a `architecture.md` reserva Edge Functions para webhooks. A implementação de 3.2 usou Server Action. Mantemos Server Action por consistência (decisão Q6 do plano). Se a performance ≥ NFR1 (< 2s) não for atingida, considerar mover para Edge no escopo de 3.5 ou em refactoring posterior.

**Interpretação operacional:**

- **AC #1:** disparado por `createEvent` (novo evento) e `updateEvent` (editado). Em ambos os casos, o engine computa o nível para o evento corrente E re-avalia vizinhos cuja janela de avaliação inclui o evento corrente (max 15 dias).
- **AC #2:** "backend" = Server Action `src/features/calendar/actions.ts`. Engine vive em `src/features/calendar/logic/`. O orquestrador (`evaluate-conflict.ts`) tem `import 'server-only'` porque faz queries Drizzle. As regras (`rules/*.ts`) são funções puras (nenhum import de DB).
- **AC #3-5:** ver § "Algoritmo v1.2 formalizado" abaixo. As 3 regras são avaliadas e a regra com maior gravidade vence (RED > YELLOW > GREEN > null). `null` só é possível teoricamente quando não há outros eventos; na prática, sem conflitos retorna **GREEN**.
- **AC #6:** justificativa é uma `string | null` em PT-BR, montada por `logic/justifications.ts`. Quando múltiplas regras disparam, concatenar com `" + "`. Exemplos canônicos no § "Justificativas" abaixo.

## Tasks / Subtasks

- [ ] **T1 · Migration 009 + schema (AC 6)**
  - [ ] Criar `supabase/migrations/009_events_conflict.sql` (manual, sem `drizzle-kit generate` — lição da 3.2):
    - `ALTER TABLE events ADD COLUMN conflict_level text CHECK (conflict_level IN ('green','yellow','red'))`
    - `ALTER TABLE events ADD COLUMN conflict_justification text`
    - **Não** adicionar índice em `conflict_level` — cardinalidade baixa, queries agregam por `event_date` (índice 008 já cobre)
  - [ ] Atualizar `src/db/schema/events.ts`: adicionar `conflictLevel: text('conflict_level', { enum: ['green','yellow','red'] })` e `conflictJustification: text('conflict_justification')`. Ambos opcionais (sem `.notNull()`).
  - [ ] Atualizar `src/db/schema/schema.test.ts` para assertar as 2 novas colunas.

- [ ] **T2 · Tipos + utilitários base (diff de datas + normalização)**
  - [ ] Estender `src/features/calendar/types.ts`:
    - `interface RuleHit { rule: 'genre' | 'non_local_artist' | 'local_artist_saturation'; level: ConflictLevel; details: Record<string, unknown> }`
    - `interface ConflictEvaluation { level: ConflictLevel; justification: string | null; rules: RuleHit[] }`
    - `interface ResolvedLineupEntry { name: string; normalizedName: string; isLocal: boolean }`
    - Estender `CalendarEvent` com `conflictLevel: ConflictLevel | null` e `conflictJustification: string | null`
  - [ ] Criar `src/features/calendar/logic/dates.ts`:
    - `diffCalendarDays(a: string, b: string): number` — abs diff em dias entre duas strings `YYYY-MM-DD`
  - [ ] Testes em `src/features/calendar/logic/dates.test.ts`
  - [ ] Criar `src/features/calendar/logic/normalize.ts`:
    - `normalizeArtistName(s: string): string` → lowercase + trim + colapsar espaços + strip diacritics (`s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`)**. NÃO usar em gêneros musicais** — para gêneros, usar apenas `trim().toLowerCase()`.
    - `parseLocation(loc: string | null): { city: string; uf: string } | null` → split na primeira vírgula, normaliza ambos os lados, **valida UF contra lista canônica de 27 UFs brasileiras** (constante `BRAZILIAN_UFS` exportada). Retorna `null` se split falhar ou UF não validar.
    - `isSameLocale(a: string | null, b: string | null): boolean` → ambos parseiam, ambos têm `city` e `uf` iguais (case-insensitive). Se qualquer um retorna `null` → **`false`** (conservador).
  - [ ] Testes em `src/features/calendar/logic/normalize.test.ts`: cobertura para todos os 3 helpers, incluindo edge cases (null, vazio, UF inválida, vírgula extra, acentos).

- [ ] **T3 · Regra: mesmo gênero (AC 3, 4)**
  - [ ] Criar `src/features/calendar/logic/rules/genre-window.ts`:
    - `evaluateGenreRule(candidate, others): RuleHit | null` (puro)
    - Para cada `other`, computar `daysDiff = diffCalendarDays(candidate.eventDate, other.eventDate)` (de `logic/dates.ts`)
    - Match exato (case-insensitive normalizado) de `genrePrimary`
    - `daysDiff <= 3` → RED; `4 <= daysDiff <= 7` → YELLOW; senão sem hit
    - Se múltiplos `others` matcham, retornar o `RuleHit` de maior gravidade (RED > YELLOW)
  - [ ] Testes `src/features/calendar/logic/rules/genre-window.test.ts`: matriz dos limites (`days = 0,1,2,3,4,5,6,7,8`); same vs different genre; case sensitivity; vazio.

- [ ] **T4 · Regra: artista não-local (AC 3, 4)**
  - [ ] Criar `src/features/calendar/logic/rules/non-local-artist.ts`:
    - `evaluateNonLocalArtistRule(candidate, others): RuleHit | null` (puro — recebe `ResolvedLineupEntry[]` já com `isLocal` resolvido)
    - Para cada `other`, intersectar `candidate.resolvedLineup` ∩ `other.resolvedLineup` por `normalizedName`
    - Considerar APENAS entries onde **ambos lados têm `isLocal === false`**
    - `daysDiff <= 7` → RED; `8 <= daysDiff <= 15` → YELLOW; senão sem hit
  - [ ] Testes `src/features/calendar/logic/rules/non-local-artist.test.ts`: matriz dos limites (`days = 0,1,7,8,14,15,16`); local vs non-local mix; nomes com case/diacritics diferentes; lineup vazio.

- [ ] **T5 · Regra: saturação de artistas locais (PRD § Algoritmo v1.2)**
  - [ ] Criar `src/features/calendar/logic/rules/local-artist-saturation.ts`:
    - `evaluateLocalSaturationRule(candidate, sameDayOthers): RuleHit | null` (puro)
    - Coletar todos os artistas locais distintos (`isLocal === true`, normalizedName) entre `candidate` + `sameDayOthers` (mesma `eventDate`)
    - `count >= 3` → RED; `count == 2` → YELLOW; senão sem hit
    - "Same date" = mesma `event_date` (campo `date`, sem timezone)
  - [ ] Testes `src/features/calendar/logic/rules/local-artist-saturation.test.ts`: 0/1/2/3/4 artistas locais; mistura local+non-local; deduplicação por normalizedName.

- [ ] **T6 · Justificativas em PT-BR (AC 6)**
  - [ ] Criar `src/features/calendar/logic/justifications.ts`:
    - `buildJustification(hits: RuleHit[]): string | null` — retorna `null` se array vazio ou todos GREEN
    - Templates canônicos (PT-BR):
      - Genre: `"Conflito {Vermelho|Amarelo}: Mesmo gênero ({genre}) em janela de {N} dias"` (singular `"24h"` quando N=1, `"48h"` quando N=2)
      - Non-local artist: `"Conflito {Vermelho|Amarelo}: Artista {name} em outro evento em janela de {N} dias"`
      - Local saturation: `"Conflito {Vermelho|Amarelo}: {N} artistas locais agendados na mesma data"`
    - Múltiplos hits: concatenar com `" + "`. Ex: `"Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h + Artista DJ X em outro evento em janela de 5 dias"`
  - [ ] Testes `src/features/calendar/logic/justifications.test.ts`: snapshot por regra, combinação de múltiplas regras, plural/singular de dias, vazio → null.

- [ ] **T7 · Orquestrador `evaluateConflict` (AC 2, 3, 4, 5, 6)**
  - [ ] Criar `src/features/calendar/logic/evaluate-conflict.ts` com `import 'server-only'`:
    - `async function evaluateConflict(eventId: string, db: DbClient): Promise<ConflictEvaluation>`
    - Pipeline:
      1. Carregar `candidate` por `eventId` (incluir `lineup`, `genrePrimary`, `eventDate`, `collectiveId`)
      2. Resolver `hostLocation` = `collectives.location` do `candidate.collectiveId` (1 query)
      3. Resolver `candidateLineup` → `ResolvedLineupEntry[]`: para cada string em `lineup`, fazer lookup em `artists` por `LOWER(artisticName) = normalizedName` (LIMIT 1, conservador). Se encontrar, comparar `artists.location` com `hostLocation` via `isSameLocale()`. Se não encontrar → `isLocal: false` (conservador — trata como non-local, dispara regras mais agressivas).
      4. Carregar `others`: eventos com `event_date` em janela `[candidate.event_date - 15d, candidate.event_date + 15d]`, **excluindo o próprio candidate.id**. **Cross-collective**: NÃO filtrar por `collective_id` (decisão deliberada — ver § Segurança).
      5. Para cada `other`, resolver `other.resolvedLineup` da mesma forma (com cache local em Map para evitar re-query do mesmo artist string)
      6. Chamar 3 regras em paralelo: `genre`, `non-local-artist`, `local-saturation` (esta última com `sameDayOthers = others.filter(o => o.event_date === candidate.event_date)`)
      7. Merge dos `RuleHit[]` → escolher maior gravidade global → montar justification via `buildJustification`
      8. Retornar `ConflictEvaluation`
  - [ ] Testes `src/features/calendar/logic/evaluate-conflict.test.ts`:
    - **Mock do `db`** (Drizzle client) para isolar lógica
    - Casos: sem outros eventos → GREEN, sem justificativa
    - Boundary days (3↔4, 7↔8, 15↔16) com cada regra
    - Múltiplas regras simultâneas (gênero + artista não-local) → RED + justificativa concatenada
    - Saturação de locais: 1 → null, 2 → YELLOW, 3 → RED
    - Cross-collective: candidate de coletivo A vê evento de coletivo B
    - Artista não encontrado em `artists` table → tratado como non-local

- [ ] **T8 · Hook do engine em `actions.ts` (AC 1)**
  - [ ] Atualizar `src/features/calendar/actions.ts`:
    - Em `createEvent` após o `INSERT`:
      1. Chamar `evaluateConflict(insertedEvent.id, db)` → `ConflictEvaluation`
      2. `UPDATE events SET conflict_level = ?, conflict_justification = ? WHERE id = ?`
      3. Identificar **vizinhos a recomputar**: SELECT `id` FROM `events` WHERE `event_date` BETWEEN `inserted.event_date - 15d` AND `inserted.event_date + 15d` AND `id != inserted.id` (cross-collective)
      4. Para cada neighbor → `evaluateConflict(neighbor.id, db)` → UPDATE
    - Em `updateEvent` após o `UPDATE`:
      1. **Recomputar vizinhos da posição ANTIGA** (caso `event_date` tenha mudado): janela ao redor de `existing[0].eventDate`
      2. Recomputar `conflict_level` do próprio evento
      3. **Recomputar vizinhos da posição NOVA** (mesma lógica que createEvent)
      - Deduplicar IDs entre as duas janelas para não recomputar 2x
    - **Tudo dentro de `db.transaction(async (tx) => { ... })`** para atomicidade. Se evaluation falhar, rollback do INSERT.
    - **Logging:** se evaluation lançar exceção, NÃO falhar o INSERT (graceful degradation) — registrar via `console.error` (Sentry nas próximas stories), persistir evento com `conflict_level: null` e `conflict_justification: 'Falha ao avaliar — verificar logs'`. Decisão: prefer evento criado sem nível a usuário travado.
  - [ ] Atualizar testes `src/features/calendar/__tests__/actions.test.ts`:
    - createEvent persiste `conflict_level` correto (mock do engine retorna RED → DB tem RED)
    - createEvent recomputa N vizinhos (verificar via mock que `evaluateConflict` foi chamado N+1 vezes)
    - updateEvent com mudança de data → recomputa janelas antiga + nova (deduplicadas)
    - Falha do engine → evento ainda é criado, com level null + justificativa de erro

- [ ] **T9 · Health Pulse real + types + events-queries (AC 5 indireto)**
  - [ ] Atualizar `src/features/calendar/queries.ts` (`getHealthPulseForRange`):
    - Substituir o stub atual (linhas 30-33 retornam `null` para todo dia) por:
      ```sql
      SELECT event_date, conflict_level FROM events
      WHERE collective_id = $1 AND event_date BETWEEN $2 AND $3
      ```
    - Agregar em JS: para cada `event_date`, coletar `ConflictLevel[]` não-nulos → `aggregateHighestLevel()` (já existe em `health-pulse.ts`). Dias sem eventos → `null`. Dias com eventos mas todos com `conflict_level = null` → `null` (mesma representação; UI não precisa diferenciar nesta story).
  - [ ] Atualizar testes `src/features/calendar/queries.test.ts`: mockar DB retornando mistura de níveis, assertar agregação correta (RED + GREEN no mesmo dia → RED).
  - [ ] Atualizar `src/features/calendar/events-queries.ts` (`getEventsForRange`): mapear `r.conflictLevel` e `r.conflictJustification` para o `CalendarEvent` retornado.

- [ ] **T10 · UI: justificativa no DayDetailSheet (AC 6 / FR22)**
  - [ ] Atualizar `src/features/calendar/components/day-detail-sheet.tsx`:
    - Para cada evento na lista, exibir:
      - Dot colorido (`<span class="inline-block w-2 h-2 rounded-full bg-{green|yellow|red}-500">` ou usar tokens neon do `tailwind.config.ts`) — cor baseada em `event.conflictLevel`. `null` → cinza/sem dot
      - Nome do evento (já existe)
      - **Nova linha de subtítulo** (`<p class="text-xs text-muted-foreground">`) com `event.conflictJustification` quando não-null
    - Ícones semânticos por nível (UX-DR9): reusar `Check`/`AlertTriangle`/`X` do `lucide-react` (já em uso no DayCell)
    - **Acessibilidade:** dot tem `aria-label="Conflito {nível}: {justificativa}"`; cor + ícone (não cor sozinha)
  - [ ] Criar `src/features/calendar/components/day-detail-sheet.test.tsx` (não existe hoje):
    - Render com lista vazia
    - Render com evento RED + justificativa → assert dot vermelho, ícone X, texto da justificativa visível
    - Render com evento sem conflict (level null) → sem dot, sem subtítulo
    - Render com 3 eventos de níveis diferentes

- [ ] **T11 · E2E cross-collective + global-setup (AC 1-6 end-to-end)**
  - [ ] Estender `e2e/global-setup.ts`:
    - Adicionar seed de **2º coletivo "Outro Coletivo Teste"** com produtor próprio
    - Salvar storage state em `OTHER_COLLECTIVE_STORAGE_STATE` constant
    - Seedar evento no 2º coletivo: `name: "Festa Concorrente"`, `event_date: hoje + 1 dia`, `genre: 'Techno'`, `lineup: ["DJ Externo"]`, `location: "Recife, PE"`
  - [ ] Criar `e2e/conflict-detection.spec.ts`:
    - **Cenário RED gênero:** produtor (coletivo A) cria evento `Techno` em `hoje + 2 dias` (Δ=1 dia vs evento seedado) → assert célula do dia vira RED no grid → click → Sheet mostra justificativa "Mesmo gênero (Techno) em janela de 24h"
    - **Cenário YELLOW gênero:** produtor cria evento `Techno` em `hoje + 6 dias` (Δ=5 dias) → assert YELLOW
    - **Cenário GREEN:** produtor cria evento `House` em `hoje + 2 dias` → assert sem dot/cinza
    - **Cenário recompute:** após criar 2º evento, fechar Sheet, reabrir o evento ORIGINAL (do outro coletivo via outro storage state, ou via DB seed) → confirmar que o nível dele também foi recomputado
  - [ ] Documentar no spec: requer Supabase preview no CI (per `MEMORY.md` → CI Supabase setup), seed cross-collective via `global-setup.ts`

- [ ] **T12 · Regressões, lint, type-check, perf check (NFR1)**
  - [ ] `npm run type-check` → 0 erros
  - [ ] `npm run lint` → 0 warnings
  - [ ] `npm run test` → 100% passando (208 + ~40 novos)
  - [ ] `npm run test:e2e` → todos cenários novos verdes
  - [ ] **Perf smoke:** medir tempo de `createEvent` (Server Action) com 30 vizinhos no DB. Target < 2s (NFR1). Se > 1s, considerar:
    - Eager loading de `artists` em batch (single query `WHERE artistic_name IN (...)`)
    - Adiar `aggregateHighestLevel` para uma query SQL (`MAX(CASE WHEN ... )`) em refactor futuro
  - [ ] Atualizar `MEMORY.md` com nova entry: `"Story 3.3 — Conflict Engine — matching de artistas é string-normalizada (lineup ↔ artists FK é tech debt)"`

## Topics for Retrospective (Epic 3)

> Registrar para discussão na retrospectiva do Épico 3 (`epic-3-retrospective`).
> **NÃO implementar na Story 3.3** — o comportamento atual é o especificado abaixo.

1. **Eventos públicos cross-visible?** Hoje o calendário só mostra eventos do próprio coletivo (`WHERE collective_id = myId`), mesmo quando o outro coletivo marcou `is_name_public: true`. Deveríamos mostrar eventos públicos de outros coletivos no grid e no Sheet? Decisão de produto — não técnica. Se aprovado, a mudança é trivial (remover filtro de `collective_id` + adicionar condição `WHERE is_name_public = true`).

2. **Engine deve ignorar eventos 100% privados?** Hoje o engine lê todos os eventos independente de `is_name_public`, `is_location_public`, `is_lineup_public`. Um coletivo com evento completamente privado ainda gera conflito e o outro lado recebe justificativa opaca ("Mesmo gênero em janela de X dias"). Isso está alinhado com "Proteção, não Censura" (PRD: *"incentivando a comunicação direta e a união da cena"*), mas o trade-off é: a utilidade do alerta vs. o direito de planejar em segredo. Validar com usuários reais.

3. **Gênero do coletivo como proxy de conflito?** Hoje NÃO usamos `collectives.genre_primary` como sinal. Um coletivo de Techno pode fazer evento de House sem gerar falso RED. Pós-MVP, considerar regra branda (nunca RED, sempre YELLOW) quando coletivo do mesmo gênero tem evento privado na mesma data. Justificativa seria: *"Possível conflito: coletivo de Techno com evento nesta data"*.

4. **Tech debt: lineup ↔ artists FK.** Matching de artistas no engine é string-normalizado (`normalizeArtistName`). Grafias diferentes do mesmo artista não casam (ex: "DJ X" vs "D.J. X" vs "Dj X."). Discussão: vale adicionar FK `lineup_item → artists.id` e normalizar na origem (Story de cadastro de evento), ou resolvemos com normalização mais agressiva (remover pontuação, apóstrofos, artigos)?

5. **Visibilidade da fonte do conflito.** Hoje a justificativa menciona o nome do artista conflitante mas NÃO o nome do coletivo, nome do evento, local ou data exata do evento conflitante. A Story 4.1 (Painel Lateral de Resolução) vai expor coletivo + contato. Decisão pendente: a justificativa deve ou não revelar progressivamente mais informação conforme flags de privacidade do outro evento?

## Dev Notes

### Contexto de negócio

Story que entrega o **núcleo de inteligência coletiva** do Agenda Clubber (PRD § "Innovation & Novel Patterns"). Sem o motor de regras, o calendário só mostra dots cinzas — o produto perde sua proposta de valor central ("automação da consciência coletiva", PRD:30). Esta story é o **primeiro momento** onde o usuário recebe feedback objetivo de "Verde/Amarelo/Vermelho" (UX-DR4 + FR21). É também o pré-requisito direto da Story 3.5 (delay ético — só dispara em RED) e Story 4.2 (e-mail de conflito — só dispara em RED/YELLOW).

### Algoritmo v1.2 formalizado

Fonte canônica: `prd.md:133-136`.

```
RED (Vermelho — Crítico):
  - Mesmo gênero em janela de ≤ 3 dias
  - Mesmo artista NÃO-LOCAL em janela de ≤ 7 dias
  - 3+ artistas LOCAIS na mesma data

YELLOW (Amarelo — Médio):
  - Mesmo gênero em janela de 4-7 dias
  - Mesmo artista NÃO-LOCAL em janela de 8-15 dias
  - 2 artistas LOCAIS na mesma data

GREEN (Verde — Saudável):
  - Nenhuma das condições acima
  - (Resolução bilateral chega na Story 4.4)
```

**Definições operacionais:**

- **"Mesmo gênero":** `events.genre_primary` exato, comparado case-insensitive via `trim().toLowerCase()`. **NÃO usar `normalizeArtistName`** — gêneros não têm diacritics e não precisam de strip de acentos.
- **"Mesmo artista":** string em `lineup` (jsonb array) com mesmo `normalizedName` em pelo menos 2 eventos. Matching é string — não há FK para `artists` (tech debt).
- **"Não-local":** artista cuja `location` em `artists` table NÃO casa com `collectives.location` do coletivo do evento (mesmo `city` E mesma `uf`, validados contra lista de 27 UFs BR). Se o artista não existe em `artists` (lineup tem string que não é um artista cadastrado) → tratado como **não-local** (conservador, dispara regras mais fortes).
- **"Janela de N dias":** `diffCalendarDays(eventDateA: string, eventDateB: string): number` — diferença absoluta em dias entre duas strings `YYYY-MM-DD` (campo `date` do PG, sem timezone). Cálculo: `Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000)`. Criar em `logic/dates.ts` (compartilhado entre todas as regras).
- **"Same date" (regra de saturação):** mesmo valor exato de `event_date`.

### Justificativas (PT-BR canônico)

Templates exatos em `logic/justifications.ts`. **Não inventar variações.**

| Regra | Template | Exemplo |
|-------|----------|---------|
| Genre RED, N≤2 dias | `"Conflito Vermelho: Mesmo gênero ({genre}) em janela de {Nh}h"` (N×24h) | `"Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h"` |
| Genre RED, N=3 dias | `"Conflito Vermelho: Mesmo gênero ({genre}) em janela de 3 dias"` | `"Conflito Vermelho: Mesmo gênero (House) em janela de 3 dias"` |
| Genre YELLOW, N=4-7 | `"Conflito Amarelo: Mesmo gênero ({genre}) em janela de {N} dias"` | `"Conflito Amarelo: Mesmo gênero (Techno) em janela de 5 dias"` |
| Non-local artist RED, N≤7 | `"Conflito Vermelho: Artista {name} em outro evento em janela de {N} dias"` | `"Conflito Vermelho: Artista DJ X em outro evento em janela de 5 dias"` |
| Non-local artist YELLOW, N=8-15 | `"Conflito Amarelo: Artista {name} em outro evento em janela de {N} dias"` | `"Conflito Amarelo: Artista DJ X em outro evento em janela de 12 dias"` |
| Local saturation RED, count≥3 | `"Conflito Vermelho: {count} artistas locais agendados na mesma data"` | `"Conflito Vermelho: 3 artistas locais agendados na mesma data"` |
| Local saturation YELLOW, count=2 | `"Conflito Amarelo: 2 artistas locais agendados na mesma data"` | (idem) |
| Múltiplas regras | `"{just1} + {just2}"` | `"Conflito Vermelho: Mesmo gênero (Techno) em janela de 48h + Artista DJ X em outro evento em janela de 5 dias"` |
| GREEN | `null` | (sem texto) |

**Formatação de horas/dias:** N=1 dia → `"24h"`, N=2 → `"48h"`, N=3 → `"3 dias"`. N=4 em diante → `"{N} dias"`. Usar singular/plural correto em PT-BR.

### Arquitetura — guardrails obrigatórios

- **Stack:** Next 15 + React 19 + Supabase SSR + Drizzle 0.45.2. **Não introduzir novas libs nesta story** (zustand, tanstack-query, leaflet já vieram em 3.2).
- **Feature folder:** todo código novo em `src/features/calendar/logic/`. Componente UI tocado: apenas `day-detail-sheet.tsx`.
- **Migrations manuais** (lição 3.2): `drizzle-kit generate` requer DB; SQL hand-written em `supabase/migrations/009_events_conflict.sql`. Usar `IF NOT EXISTS`/`IF EXISTS` para idempotência.
- **`server-only`**: `evaluate-conflict.ts` (faz queries Drizzle) — sim. Regras puras em `rules/*.ts` — **NÃO** (devem ser importáveis de testes Node).
- **Drizzle bypassa RLS** ✅ — engine lê eventos cross-collective deliberadamente. Documentar como decisão arquitetural (Story 3.4 fechará o vazamento de exibição via RLS de leitura, mas o engine continua bypassando para cálculo).
- **Naming** (architecture.md:154-165): tabelas snake_case plural; colunas snake_case (`conflict_level`, `conflict_justification`); código TS camelCase (`conflictLevel`, `conflictJustification`).
- **API response wrapper** (architecture.md:180): `createEvent`/`updateEvent` já retornam `{ data, error }`; manter padrão. Engine retorna direto (consumido só dentro do server).
- **Zod-first**: nenhum input de Server Action processado sem `safeParse`. O engine recebe IDs validados pela action — não revalida.
- **JSDoc obrigatório** (architecture.md:203) em `evaluateConflict` e cada regra: descrever rule windows, return shape, edge cases.
- **Estética Line-over-Black** (UX): dots em `bg-neon-{red|yellow|green}` (tokens já existem do 3.1) ou fallback `bg-{red|yellow|green}-500`. Justificativa em `text-xs text-muted-foreground`.
- **Acessibilidade (UX-DR9):** cor + ícone semântico em todo indicador. `aria-label` descritivo no dot.

### Decisão arquitetural: persistência + recompute (Q5 do plano)

**Modelo escolhido:** denormalizar `conflict_level` + `conflict_justification` em `events` e recomputar vizinhos transacionalmente em writes. Trade-off:

| | Compute-on-read | **Compute-on-write (escolhido)** | Materialized view |
|---|---|---|---|
| Latência de leitura (grid 30 dias) | ~30 evaluations × ~6 queries cada = O(180) round-trips | **1 query simples** | 1 query |
| Latência de escrita (createEvent) | ~6 queries (sem recompute) | **~6 + (15 × 6) = ~96 queries** (15 vizinhos × 6 queries cada) | ~6 queries |
| Risk de stale data | 0 | **Recompute transacional cobre vizinhos imediatos** | Refresh assíncrono — pode ficar stale |
| Complexidade | Baixa | **Média** | Alta (Postgres setup + refresh strategy) |

**Por que compute-on-write apesar do custo:** o usuário decidiu (Q5) "menos problema mesmo que mais lento". Reads são extremamente frequentes (cada load de dashboard); writes são raros (~1-3/dia por coletivo). Recompute touch-set é bounded (max 15 vizinhos no espaço de janela) → write fica em **O(constante)** mesmo com escala.

**Recomputo: granularidade.** Em `createEvent`, recomputar TODOS os vizinhos em `[event_date - 15d, event_date + 15d]` cross-collective. Em `updateEvent`, recomputar janelas ao redor da posição ANTIGA E NOVA (deduplicadas). Em delete (não nesta story, mas planejar): recomputar janela ao redor do evento removido antes do `DELETE`.

### Decisão arquitetural: Server Action vs Edge Function (Q6 do plano)

Epic AC #2 diz literalmente "When the backend (Edge Functions) evaluates the input". Architecture.md:121 reserva Edge para webhooks; 121:123 diz Server Actions são a fronteira UI ↔ DB. Story 3.2 implementou Server Action.

**Decisão:** manter Server Action por consistência. Se NFR1 (< 2s) não bater em produção com payload realista, refactor para Vercel Edge Runtime no escopo de uma story de performance posterior. Não introduzir Edge agora — risco de divergência arquitetural sem benefício comprovado.

### Definição de "local" e matching de artistas (Q3 + Q4 do plano)

**Schemas atuais:**
- `collectives.location: text` (single string, sem split city/uf)
- `artists.location: text` (single string)
- `events.lineup: jsonb` (array de strings free-text)

**Convenção assumida:** `"City, UF"` (ex: `"Recife, PE"`, `"São Paulo, SP"`). Onboarding (Stories 1.3, 1.4) capturou texto livre — não há garantia de formato. Por isso:

1. `parseLocation(loc)` tenta split na primeira vírgula. Valida UF contra lista canônica de 27 UFs BR (constante exportada).
2. Se parse falha → `isSameLocale` retorna `false` (artista tratado como **não-local**).
3. Tech debt: futura story de "Limpeza de dados de localidade" pode adicionar campos `city`/`uf` separados em `collectives` e `artists`. Não escopo aqui.

**Matching de artistas:**
1. `normalizeArtistName(string)` aplica lowercase + trim + colapsa whitespace + strip diacritics.
2. Lookup em `artists` por `LOWER(artistic_name) = normalizedName` LIMIT 1.
3. Se encontrado → resolver `isLocal` via `isSameLocale(artist.location, host.location)`.
4. Se não encontrado → `isLocal: false` (conservador).

**Limitação conhecida:** strings idênticas mas grafias diferentes (ex: `"DJ X"` vs `"D.J. X"` vs `"Dj X."`) podem não casar. Aceitável para MVP — registrar como tech debt em `MEMORY.md`.

### Modelo de dados — diff schema

```sql
-- Migration 009
ALTER TABLE events ADD COLUMN conflict_level text
  CHECK (conflict_level IN ('green', 'yellow', 'red'));
ALTER TABLE events ADD COLUMN conflict_justification text;
```

**Sem nova índice:** `events_collective_date_idx (collective_id, event_date)` da migration 008 atende as queries do engine. `conflict_level` tem cardinalidade baixa (4 valores incluindo null) — index seletivo.

**Defaults:** ambas colunas nullable. Eventos pré-existentes (criados em 3.2) ficam com `null` até serem editados (que dispara recompute) ou até a próxima ingestão. **Não fazer backfill nesta story** — `getHealthPulseForRange` lida com `null` graciosamente (retorna `null` no pulse, que renderiza como cinza/sem glow).

### Padrões herdados (não-negociáveis)

1. **`escapeLikePattern()`** (`src/lib/db/like-pattern.ts`, retro Épico 2 #1) — se algum lookup textual usar `LIKE`/`ILIKE`, escapar.
2. **`rowCount ?? 0`** em ops idempotentes (lição Story 2.3) — recompute pode resultar em 0 rows updated; tratar como sucesso.
3. **`.limit(1)` SEMPRE com `.orderBy(...)`** (lição review 3.1, H1) — lookup de artist único deve ter ORDER BY (ex: `artistic_name`).
4. **`new Date()` como default param PROIBIDO** (lição review 3.1, M1) — `evaluateConflict` recebe `now` como param obrigatório.
5. **`NEXT_PUBLIC_TIMEZONE`** já existe (review 3.1, M2). Usar em qualquer cálculo de "hoje". Fallback `'America/Sao_Paulo'`.
6. **Drizzle camelCase ↔ snake_case** via `columnName: text('column_name')` mapping. Manter.
7. **Review adversarial em 3 camadas** (Retro Épico 2 #3) obrigatório antes do merge. Os 3 papéis: edge-case-hunter, blind-test, acceptance-auditor (per `MEMORY.md` → feedback_review_prompts_pattern).

### Previous Story Intelligence (Story 3.2)

**Padrões diretamente reusáveis:**

- `getViewerContext()` em `src/features/auth/helpers.ts` — auth em Server Actions
- `getCurrentUserCollectiveId()` em `src/features/collectives/queries.ts` — resolver coletivo do user logado
- `aggregateHighestLevel()` em `src/features/calendar/health-pulse.ts` — **REUSAR** para Health Pulse query (T9)
- `formatDateKey()`, `getRollingThirtyDays()` em `date-range.ts` — manter uso
- `eventFormSchema`, `GENRE_OPTIONS` em `validations.ts` — `genrePrimary` validado pelo schema; engine confia
- `geocode()`, `resolveTimezone()`, `calculateEventDateUtc()` em `actions.ts` — **NÃO TOCAR**, só hookar engine após
- Padrão `import 'server-only'` em queries
- Padrão API wrapper `{ data: T | null, error: { message, code } | null }`
- Realtime subscription `useEventRealtime` em `hooks.ts` — **interage com 3.3**: quando neighbor é recomputado e UPDATE dispara, Realtime invalida cache; UI atualiza dots automaticamente
- `vitest.setup.ts` com cleanup automático
- `src/lib/test-utils/server-only-mock.ts` — usar em todos os testes que importam módulos `server-only`
- `PRODUCER_STORAGE_STATE` em `e2e/global-setup.ts` — **estender** com `OTHER_COLLECTIVE_STORAGE_STATE`

**Lições aplicáveis das retros:**

- Lição Épico 2 #1: backend-first com stub. Aqui já temos eventos reais (3.2) — engine substitui o stub do health pulse direto.
- Lição Épico 2 #2: defesa em profundidade RLS + app-layer. Aqui NÃO aplicamos RLS (Story 3.4); engine bypassa deliberadamente para ler cross-collective. App-layer continua filtrando display por coletivo no Sheet.
- Lição Épico 2 #4: drizzle-kit migrations manuais. Migration 009 é SQL hand-written.

### Arquivos a modificar (lista exaustiva com estado atual)

| Arquivo | Estado atual | O que muda |
|---------|-------------|------------|
| `supabase/migrations/009_events_conflict.sql` | não existe | NEW — ALTER TABLE add 2 columns |
| `src/db/schema/events.ts` | 18 colunas | UPDATE — add `conflictLevel`, `conflictJustification` |
| `src/db/schema/schema.test.ts` | testa 18 colunas | UPDATE — assert 20 colunas |
| `src/features/calendar/types.ts` | `ConflictLevel`, `HealthPulseMap`, `CalendarEvent` | UPDATE — add `RuleHit`, `ConflictEvaluation`, `ResolvedLineupEntry`; estender `CalendarEvent` |
| `src/features/calendar/logic/dates.ts` | não existe | NEW — `diffCalendarDays` |
| `src/features/calendar/logic/dates.test.ts` | não existe | NEW — testes |
| `src/features/calendar/logic/normalize.ts` | não existe | NEW — `normalizeArtistName`, `parseLocation`, `isSameLocale`, `BRAZILIAN_UFS` |
| `src/features/calendar/logic/normalize.test.ts` | não existe | NEW — testes |
| `src/features/calendar/logic/rules/genre-window.ts` | não existe | NEW — regra pura |
| `src/features/calendar/logic/rules/genre-window.test.ts` | não existe | NEW |
| `src/features/calendar/logic/rules/non-local-artist.ts` | não existe | NEW — regra pura |
| `src/features/calendar/logic/rules/non-local-artist.test.ts` | não existe | NEW |
| `src/features/calendar/logic/rules/local-artist-saturation.ts` | não existe | NEW — regra pura |
| `src/features/calendar/logic/rules/local-artist-saturation.test.ts` | não existe | NEW |
| `src/features/calendar/logic/justifications.ts` | não existe | NEW — builder PT-BR |
| `src/features/calendar/logic/justifications.test.ts` | não existe | NEW |
| `src/features/calendar/logic/evaluate-conflict.ts` | não existe | NEW — orquestrador `server-only` |
| `src/features/calendar/logic/evaluate-conflict.test.ts` | não existe | NEW — mock DB |
| `src/features/calendar/actions.ts` | createEvent + updateEvent sem hook | UPDATE — chamar engine + recomputar vizinhos transacionalmente |
| `src/features/calendar/__tests__/actions.test.ts` | testa happy path + erros | UPDATE — adicionar persistência de level + neighbor recompute |
| `src/features/calendar/queries.ts` | stub retornando null em todo dia | UPDATE — agregação real via `aggregateHighestLevel` |
| `src/features/calendar/queries.test.ts` | testa 30 nulls | UPDATE — testa agregação real |
| `src/features/calendar/events-queries.ts` | mapeia 18 campos | UPDATE — mapear `conflictLevel`, `conflictJustification` |
| `src/features/calendar/components/day-detail-sheet.tsx` | lista nome do evento | UPDATE — dot colorido + linha de justificativa |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | não existe | NEW |
| `e2e/global-setup.ts` | seed PRODUCER_STORAGE_STATE | UPDATE — add OTHER_COLLECTIVE_STORAGE_STATE + seed evento conflitante |
| `e2e/conflict-detection.spec.ts` | não existe | NEW — RED/YELLOW/GREEN cross-collective |
| `MEMORY.md` (auto-memory) | 2 entries | UPDATE — add entry sobre matching de artistas e tech debt lineup↔artists |

### Não modificar sem necessidade

- `src/features/calendar/date-range.ts`, `date-range.test.ts` — estáveis, sem mudanças
- `src/features/calendar/health-pulse.ts`, `health-pulse.test.ts` — função `aggregateHighestLevel` é reusada, não modificada
- `src/features/calendar/map.ts` — sem mudanças
- `src/features/calendar/validations.ts` — `eventFormSchema`, `GENRE_OPTIONS` continuam como estão
- `src/features/calendar/store.ts`, `hooks.ts` — Zustand + Realtime sem mudanças (Realtime invalida cache automaticamente quando neighbor é UPDATEd)
- `src/features/calendar/components/calendar-grid.tsx`, `calendar-grid-client.tsx`, `calendar-grid-section.tsx`, `day-cell.tsx`, `day-cell.test.tsx`, `weekday-header.tsx`, `calendar-empty-state.tsx`, `calendar-grid-skeleton.tsx` — sem mudanças (DayCell já consome `level` da pulseMap)
- `src/components/ui/*` — Shadcn, não editar manualmente
- `src/lib/routes.ts` — sem novas rotas
- `src/middleware.ts` — sem mudanças
- Migrations 000-008 — não tocar

### Real-time considerations

`useEventRealtime` (3.2) escuta INSERT/UPDATE/DELETE no canal `events:{collectiveId}`. Quando 3.3 fizer UPDATE em vizinhos durante recompute, o canal disparará — clientes conectados receberão a notificação e invalidarão a query do TanStack Query. **Já funciona automaticamente** — não precisa código novo. Apenas verificar no E2E que após criar 2º evento, o dot do 1º evento (de outro coletivo) também atualiza.

**Cuidado:** subscription atual filtra por `collective_id`. Cliente do coletivo A NÃO recebe notificação de UPDATE em evento do coletivo B. Isso é OK para 3.3 (cliente A não vê eventos de B no Sheet — Story 3.4 trata privacidade). Quando 3.4 expor display cross-collective, considerar canal global ou re-fetch on demand.

### Performance

- **Target NFR1:** cálculo de conflitos < 2s.
- **Worst case writes:** createEvent com 15 vizinhos cross-collective × 3 regras (genre, non-local, saturation) × ~6 queries cada (load candidate + host + lineup resolve + others + sameDay subset + UPDATE) = ~100 round-trips. Em Supabase realistic latency (~30ms p95), ~3s — **acima do target**.
- **Otimizações para T8/T12:**
  1. Batch lookup de artistas: 1 query `WHERE LOWER(artistic_name) IN (...)` com todos os nomes únicos do candidate + others, em vez de query por nome. Reduz para O(1) round-trip de resolução.
  2. Carregar `others` em 1 query única (já planejado).
  3. Aplicar regras puras em memória (sem I/O).
  4. UPDATE em batch via `db.update().where(inArray(events.id, neighborIds))` — mas cada vizinho tem level/justificativa diferente, então é UPDATE individual mesmo. Acceitável.
- **Profiling sugerido em T12:** medir tempo total de createEvent localmente com seed de 30 vizinhos. Logar via `console.time`.

### Segurança e privacidade

- **Cross-collective read deliberado.** O engine lê eventos de outros coletivos para detectar conflitos. **Isso é o ponto da feature.**
- **Drizzle bypassa RLS** (já é assim em 3.2). Aceitável porque:
  - Story 3.4 adicionará RLS específico para SELECT cross-collective filtrando por `is_*_public` flags
  - Engine continua bypassando para cálculo (server-only context)
  - Display no Sheet continua filtrando por `collective_id == myCollectiveId` (app-layer check)
- **Justificativa pode vazar nomes de artistas** de eventos de outros coletivos (ex: "Artista DJ X em outro evento em janela de 5 dias"). Decisão deliberada para 3.3: vazar apenas o **nome do artista**, não o nome do evento, local, ou coletivo conflitante. Story 4.1 vai expor coletivo+contato (consensual). Se quiser ocultar nome do artista também: refactor 3.4.
- **Ownership check** em `updateEvent` continua: só `created_by` pode editar (já em 3.2). Engine chamado pelo owner.

### URLs e roteamento

- **Sem novas rotas.** Toda a UI vive dentro do `DayDetailSheet` em `/dashboard/collective`.

### Dependências

**Nenhuma nova dependência.** Tudo já está no `package.json` desde 3.2 (Drizzle, Zod, React, Sonner, etc).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3] (linhas 407-420)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements] (FR21, FR22, linhas 36-37)
- [Source: _bmad-output/planning-artifacts/prd.md#Algoritmo-de-Detecção-de-Choque-v1.2] (linhas 133-136 — fonte canônica das 3 famílias de regras)
- [Source: _bmad-output/planning-artifacts/prd.md#Lógica-de-Inteligência-de-Conflitos] (FR21, FR22, FR23, linhas 173-175)
- [Source: _bmad-output/planning-artifacts/prd.md#Performance] (NFR1 < 2s, linha 186)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture] (Drizzle + Zod, linhas 106-109)
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Boundaries] (Conflict Engine isolado em `features/calendar/logic/`, linha 271)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture] (Zustand + TanStack Query, linha 126 — já em uso)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] (naming, Zod-first, API wrapper, JSDoc obrigatório em conflict logic, linhas 154-203)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Conflict-Indicator] (UX-DR4 visual semáforo)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] (UX-DR9 cor + ícone + ARIA, linhas 191-194)
- [Source: _bmad-output/implementation-artifacts/3-1-grid-do-calendario-e-visualizacao-de-saude-da-cena.md] (padrões `aggregateHighestLevel`, `HealthPulseMap`, lessons review M1/M2/H1)
- [Source: _bmad-output/implementation-artifacts/3-2-cadastro-de-evento-e-geolocalizacao.md] (padrões `createEvent`, `updateEvent`, schema events, Realtime, `useEventRealtime`, `getViewerContext`)
- [Source: src/db/schema/events.ts] (schema atual da tabela events)
- [Source: src/db/schema/collectives.ts] (location: text único)
- [Source: src/db/schema/artists.ts] (location: text único)
- [Source: src/features/calendar/queries.ts] (stub atual de getHealthPulseForRange a substituir)
- [Source: src/features/calendar/health-pulse.ts] (aggregateHighestLevel — REUSAR)
- [Source: src/features/calendar/actions.ts] (createEvent + updateEvent — pontos de hook)
- [Source: src/features/calendar/components/day-detail-sheet.tsx] (componente UI a estender)
- [Source: supabase/migrations/008_events.sql] (índice `events_collective_date_idx` reusado)
- [Source: e2e/global-setup.ts] (PRODUCER_STORAGE_STATE — estender com OTHER_COLLECTIVE)
- [Source: C:\Users\magal\.claude\projects\D--Repos-agenda-clubber\memory\MEMORY.md] (CI Supabase setup, padrão de prompts de revisão LLM)

## Dev Agent Record

### Agent Model Used

(preencher após implementação)

### Debug Log References

(preencher após implementação)

### Completion Notes List

(preencher após implementação)

### File List

(preencher após implementação)

### Change Log

(preencher após implementação)

### Review Findings

(preencher após review adversarial em 3 camadas — edge-case-hunter, blind-test, acceptance-auditor)
