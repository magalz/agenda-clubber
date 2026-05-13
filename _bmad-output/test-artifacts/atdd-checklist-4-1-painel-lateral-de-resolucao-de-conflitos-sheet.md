---
stepsCompleted: ['step-01-preflight-and-context']
lastStep: 'step-01-preflight-and-context'
lastSaved: '2026-05-12'
storyId: '4.1'
storyKey: '4-1-painel-lateral-de-resolucao-de-conflitos-sheet'
storyFile: '_bmad-output/implementation-artifacts/4-1-painel-lateral-de-resolucao-de-conflitos-sheet.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-4-1-painel-lateral-de-resolucao-de-conflitos-sheet.md'
generatedTestFiles: []
inputDocuments:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/implementation-artifacts/4-1-painel-lateral-de-resolucao-de-conflitos-sheet.md'
---

# ATDD Checklist — Story 4.1: Painel Lateral de Resolução de Conflitos (Sheet)

## Stack Detection

- **Detected Stack:** `fullstack` (Next.js App Router + Supabase PostgreSQL)
- **Unit Framework:** Vitest 4.1.4
- **E2E Framework:** Playwright 1.59.1
- **Playwright Utils:** Enabled (`tea_use_playwright_utils: true`)

## Acceptance Criteria → Red-Phase Tests

### AC #1-2: Trigger — clique no ConflictBadge RED/YELLOW abre Sheet

| Test ID | Type | Given | When | Then |
|---------|------|-------|------|------|
| ATDD-4.1-01 | Unit (EventCard) | Evento com `conflictLevel: 'red'` e click handler | Usuário clica no badge | `onConflictClick(eventId)` é chamado com o id correto |
| ATDD-4.1-02 | Unit (EventCard) | Evento com `conflictLevel: 'yellow'` | Usuário clica no badge | `onConflictClick` é chamado |
| ATDD-4.1-03 | Unit (EventCard) | Evento com `conflictLevel: 'green'` | Usuário clica no badge | `onConflictClick` NÃO é chamado (badge estático) |
| ATDD-4.1-04 | Unit (EventCard) | Badge RED | Renderização | Botão tem `aria-label` contendo "Ver detalhes do conflito" |
| ATDD-4.1-05 | Unit (ConflictResolutionSheet) | `isOpen: true`, conflitos carregados | Sheet renderizado | Título "Resolução de Conflito" visível |
| ATDD-4.1-06 | E2E | Evento RED no calendário | Clique no ConflictBadge | Sheet lateral abre com detalhes do conflito |

### AC #3: Detalhes do evento conflitante (respeitando privacidade)

| Test ID | Type | Given | When | Then |
|---------|------|-------|------|------|
| ATDD-4.1-07 | Unit (getConflictingEvents) | `event_conflicts` com par (eventA, eventB) | Query `getConflictingEvents(eventA)` | Retorna array com evento B e dados do coletivo |
| ATDD-4.1-08 | Unit (getConflictingEvents) | Evento B tem `isNamePublic: false` | Query executada | Nome retornado = "Em Planejamento" (filterEventForViewer aplicado) |
| ATDD-4.1-09 | Unit (ConflictResolutionSheet) | Evento conflitante com privacidade ativa | Renderização | Nome exibe "Em Planejamento" + ícone Lock |
| ATDD-4.1-10 | Unit (ConflictResolutionSheet) | Evento conflitante `confirmed` | Renderização | Todos os dados visíveis (sem máscara) |
| ATDD-4.1-11 | Unit (ConflictResolutionSheet) | Sem conflitos ativos (`[]`) | Renderização | Mensagem "Nenhum conflito ativo" exibida |
| ATDD-4.1-12 | E2E | Evento YELLOW com evento conflitante mascarado | Abre sheet | Nome do evento conflitante = "Em Planejamento" |

### AC #4: Botões de ação (WhatsApp + Instagram)

| Test ID | Type | Given | When | Then |
|---------|------|-------|------|------|
| ATDD-4.1-13 | Unit (ConflictResolutionSheet) | Coletivo com `whatsappPhone: '+5511999999999'` | Renderização | Link `href="https://wa.me/5511999999999"` presente |
| ATDD-4.1-14 | Unit (ConflictResolutionSheet) | Coletivo com `socialLinks.instagram: '@coletivo_x'` | Renderização | Link `href="https://instagram.com/@coletivo_x"` presente |
| ATDD-4.1-15 | Unit (ConflictResolutionSheet) | Coletivo SEM `whatsappPhone` | Renderização | Botão WhatsApp oculto ou desabilitado |
| ATDD-4.1-16 | Unit (ConflictResolutionSheet) | Coletivo SEM `instagram` | Renderização | Botão Instagram oculto ou desabilitado |
| ATDD-4.1-17 | Unit (ConflictResolutionSheet) | Ambos links presentes | Renderização | Links abrem em `target="_blank"` com `rel="noopener noreferrer"` |
| ATDD-4.1-18 | E2E | Conflito RED com WhatsApp do coletivo | Abre sheet | Botão "Chamar no WhatsApp" visível e funcional |

### AC #5: Ícones semânticos para acessibilidade (UX-DR9)

| Test ID | Type | Given | When | Then |
|---------|------|-------|------|------|
| ATDD-4.1-19 | Unit (ConflictResolutionSheet) | Sheet renderizado com contatos | Verificação de acessibilidade | Botão WhatsApp tem `aria-label` com número formatado |
| ATDD-4.1-20 | Unit (ConflictResolutionSheet) | Sheet renderizado com contatos | Verificação de acessibilidade | Botão Instagram tem `aria-label` descritivo |
| ATDD-4.1-21 | Unit (ConflictResolutionSheet) | Badge RED renderizado | Verificação de acessibilidade | Ícone X (lucide-react) + texto alternativo |
| ATDD-4.1-22 | Unit (ConflictResolutionSheet) | Sheet renderizado | Verificação de acessibilidade | `SheetTitle` e `SheetDescription` usam componentes acessíveis do Radix/Base UI |

## Implementation Checklist (Red → Green → Refactor)

### RED Phase — Escrever testes que FALHAM

- [ ] Criar `src/features/calendar/components/conflict-resolution-sheet.test.tsx`
  - [ ] Testes ATDD-4.1-05, 09, 10, 11 (renderização do sheet)
  - [ ] Testes ATDD-4.1-13, 14, 15, 16, 17 (botões de contato)
  - [ ] Testes ATDD-4.1-19, 20, 21, 22 (acessibilidade)
- [ ] Criar `src/features/calendar/queries.test.ts` com `getConflictingEvents`
  - [ ] Testes ATDD-4.1-07, 08 (query de conflitos)
- [ ] Atualizar `src/features/calendar/components/event-card.test.tsx`
  - [ ] Testes ATDD-4.1-01, 02, 03, 04 (onConflictClick)
- [ ] Criar/atualizar `e2e/conflict-resolution-sheet.spec.ts`
  - [ ] Testes ATDD-4.1-06, 12, 18 (E2E)

### GREEN Phase — Implementar até passar

- [ ] `getConflictingEvents` query → passam ATDD-4.1-07, 08
- [ ] `ConflictResolutionSheet` component → passam ATDD-4.1-05, 09, 10, 11
- [ ] Botões WhatsApp/Instagram → passam ATDD-4.1-13, 14, 15, 16, 17
- [ ] Acessibilidade → passam ATDD-4.1-19, 20, 21, 22
- [ ] `EventCard.onConflictClick` → passam ATDD-4.1-01, 02, 03, 04
- [ ] E2E → passam ATDD-4.1-06, 12, 18

### REFACTOR Phase

- [ ] Extrair lógica de formatação de link (`formatWaLink`, `formatIgLink`) para utils se reutilizado
- [ ] Revisar tipos — garantir que `ConflictingEventInfo` não duplica `CalendarEvent`
- [ ] Verificar que `DayDetailSheet` não cresceu além do aceitável (manter < 150 linhas)

## Edge Cases Identificados

| Edge Case | Handling |
|-----------|----------|
| Evento sem conflitos (GREEN) | Badge estático, sem onClick |
| Coletivo sem WhatsApp | Botão WhatsApp oculto |
| Coletivo sem Instagram | Botão Instagram oculto |
| Ambos contatos ausentes | Sheet ainda mostra detalhes do conflito, sem botões |
| Evento conflitante já resolvido (`status != 'open'`) | `getConflictingEvents` filtra por `status = 'open'` |
| Múltiplos conflitos para o mesmo evento | Sheet lista todos os eventos conflitantes |
| Conflito com evento do próprio coletivo | `event_conflicts` nunca insere self-pairs (garantido por `ne(events.id, eventId)` no `syncConflictPairs`) |
| WhatsApp phone com formatação inválida | `replace(/[+\s\-]/g, '')` normaliza; link `wa.me/` sem número = botão oculto |

## Test Data Requirements

- Seed: 2 coletivos ativos com eventos conflitantes (RED e YELLOW)
- Coletivo A: `whatsappPhone: '+5511987654321'`, `socialLinks.instagram: 'coletivo_a'`
- Coletivo B: sem WhatsApp, `socialLinks.instagram: 'https://instagram.com/coletivo_b'`
- Evento A1 (coletivo A): Techno, today+1 — RED (conflita com B1)
- Evento B1 (coletivo B): Techno, today+2 — RED
- Evento A2 (coletivo A): House, today+5 — YELLOW (conflita com B2)
- Evento B2 (coletivo B): House, today+8 — YELLOW
