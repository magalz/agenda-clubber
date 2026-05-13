# Test Design — Story 4.1: Painel Lateral de Resolução de Conflitos (Sheet)

**Date:** 2026-05-12
**Author:** Murat (Master Test Architect)
**Story:** 4.1 — Painel Lateral de Resolução de Conflitos (Sheet)
**Risk Level:** MEDIUM — UI nova, sem alteração de lógica de negócio existente

## 1. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Regressão no DayDetailSheet (mutations de status/toggle) | Low | High | Testes existentes (day-detail-sheet.test.tsx) cobrem; adicionar smoke test |
| Regressão no EventCard (ethical delay, visibility toggles) | Low | High | Testes existentes (event-card.test.tsx, 287 linhas) cobrem |
| Links wa.me/instagram quebrados (formato errado) | Medium | Medium | Testes unitários no formatador de link |
| Sheet aninhado causa conflito de z-index/foco | Medium | Low | Preferir Sheet irmã (store-driven) em vez de nested |
| Query getConflictingEvents com performance ruim | Low | Low | Tabela `event_conflicts` indexada; pares são O(n) com n pequeno |

## 2. Coverage Strategy

### Unit Tests (Vitest) — 15 testes

| Component/Module | Test Count | Priority |
|-----------------|------------|----------|
| `getConflictingEvents` (query) | 3 | P0 |
| `ConflictResolutionSheet` (render) | 5 | P0 |
| `ConflictResolutionSheet` (contact buttons) | 5 | P1 |
| `EventCard.onConflictClick` | 4 | P0 |

### E2E Tests (Playwright) — 3 cenários

| Scenario | Priority | Storage State |
|----------|----------|---------------|
| RED conflict → open sheet → WhatsApp visible | P0 | PRODUCER_STORAGE_STATE |
| YELLOW conflict → open sheet → privacy masking | P1 | PRODUCER_STORAGE_STATE |
| GREEN event → badge not clickable | P2 | PRODUCER_STORAGE_STATE |

### Regression Gates

| Gate | Command | Expected |
|------|---------|----------|
| Unit tests | `npm test -- --project=unit` | All pass (current ~488) |
| E2E tests | `npx playwright test` | Existing 42+ tests pass + 3 new |
| Type check | `npm run type-check` | Zero errors |
| Lint | `npm run lint` | Zero warnings |
| Memtrace QA | `npm run qa:memtrace` | Gate passes |

## 3. Test Architecture

### Unit: ConflictResolutionSheet

```
src/features/calendar/components/conflict-resolution-sheet.test.tsx
├── describe('ConflictResolutionSheet')
│   ├── it('renders conflicting event details with name and genre')
│   ├── it('shows "Em Planejamento" for masked events')
│   ├── it('shows full details for confirmed events')
│   ├── it('shows empty state when no conflicts')
│   ├── it('shows loading skeleton while fetching')
│   ├── it('renders WhatsApp button with correct wa.me link')
│   ├── it('renders Instagram button with correct link')
│   ├── it('hides WhatsApp button when phone is null')
│   ├── it('hides Instagram button when instagram is null')
│   ├── it('buttons open in new tab with noopener')
│   ├── it('WhatsApp button has descriptive aria-label')
│   └── it('Instagram button has descriptive aria-label')
```

### Unit: EventCard onConflictClick

```
src/features/calendar/components/event-card.test.tsx (EXTEND)
├── describe('EventCard conflict click')
│   ├── it('calls onConflictClick when RED badge is clicked')
│   ├── it('calls onConflictClick when YELLOW badge is clicked')
│   ├── it('does NOT call onConflictClick when GREEN badge is clicked')
│   └── it('conflict badge button has aria-label')
```

### Unit: getConflictingEvents query

```
src/features/calendar/queries.test.ts (EXTEND)
├── describe('getConflictingEvents')
│   ├── it('returns conflicting events from event_conflicts table')
│   ├── it('applies filterEventForViewer to external events')
│   └── it('returns empty array when no active conflicts')
```

### E2E: conflict-resolution-sheet

```
e2e/conflict-resolution-sheet.spec.ts (NEW)
├── describe('Story 4.1 — Conflict Resolution Sheet')
│   ├── test('RED: abre sheet de conflito e mostra botão WhatsApp')
│   ├── test('YELLOW: abre sheet com evento mascarado por privacidade')
│   └── test('GREEN: badge não é clicável')
```

## 4. Fixtures & Seed Data

Reusar seeds existentes do `global-setup.ts`:
- **PRODUCER_STORAGE_STATE**: "E2E Producer" do "E2E Producer Collective" (São Paulo, Techno)
- Adicionar ao seed: outro coletivo com WhatsApp e Instagram preenchidos
- Evento conflitante RED: mesmo gênero (Techno) em today+1 ou today+2

## 5. Test Priorities Matrix

| Priority | Definition | Tests |
|----------|-----------|-------|
| P0 | Block merge | Renderização do sheet, clique no badge RED/YELLOW, query getConflictingEvents |
| P1 | Should pass | Botões WhatsApp/Instagram, acessibilidade, privacidade |
| P2 | Nice to have | E2E GREEN não-clicável, loading skeleton |

## 6. CI Integration

Os testes novos integram-se automaticamente ao pipeline existente:
- `npm test` (Vitest) — unit tests inclusos
- `npx playwright test` — E2E inclusos
- `npm run type-check` — TypeScript
- `npm run lint` — ESLint
