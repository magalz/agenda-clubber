# Story 3.5: Componente de Delay Ético para Conflitos Críticos

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Producer**,
I want **to be warned and forced to pause when confirming a critical conflict**,
so that **I can reflect on the impact on the collective scene**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:436-448`](../planning-artifacts/epics.md):

1. **Given** an event evaluated as **RED (Critical Conflict)**
2. **When** the user clicks "Confirm Event"
3. **Then** the system must show the message: **"Confirmar evento mesmo com conflitos críticos?"**
4. **And** the button must enter a "Counting" state for 3 seconds with a visual progress bar (UX-DR6)
5. **And** the user must be able to cancel during the countdown.

> **Nota de interpretação do AC #3-5:** O delay ético deve ser um componente React reutilizável (`EthicalDelayButton`) que encapsula toda a lógica de countdown, progresso visual e cancelamento. Ele deve ser usado no `DayDetailSheet` quando o usuário tenta confirmar um evento com `conflictLevel === 'red'`. A transição de status (`planning → confirmed`) continua sendo executada pela Server Action `updateEventStatus` (já implementada na Story 3.4) — o delay é puramente uma camada de UI/UX que intercepta o clique antes de chamar a action.

**Interpretação operacional:**

- **AC #1-2:** O `DayDetailSheet` já exibe o `conflictLevel` (green/yellow/red) e o botão de confirmar evento. Quando `conflictLevel === 'red'` e `status === 'planning'`, o botão de confirmar deve ser substituído pelo `EthicalDelayButton`.
- **AC #3:** A mensagem deve ser exibida em um `Dialog` (Shadcn) ou diretamente no `DayDetailSheet` como um estado expandido do botão. Recomendação: `Dialog` modal para forçar o foco do usuário e garantir a leitura da mensagem.
- **AC #4:** O botão dentro do dialog deve ter uma barra de progresso visual (usando componente `Progress` do Shadcn ou animação CSS/Tailwind) que preenche de 0% a 100% em 3 segundos. O rótulo do botão deve mudar dinamicamente: `"Confirmar (3)"` → `"Confirmar (2)"` → `"Confirmar (1)"` → `"Confirmar Evento"`.
- **AC #5:** O usuário pode cancelar clicando em "Cancelar" (fecha o dialog), clicando fora do dialog (se `Dialog` for usado), ou pressionando `Escape`. Se cancelado, a Server Action `updateEventStatus` NÃO é chamada e o evento permanece em `'planning'`.

## Tasks / Subtasks

- [x] **T1 · Componente EthicalDelayButton (AC 3-5)**
  - [x] Criar `src/features/calendar/components/ethical-delay-button.tsx`:
    - Props: `onConfirm: () => void`, `onCancel: () => void`, `duration?: number` (default: 3000ms), `message?: string` (default: `"Confirmar evento mesmo com conflitos críticos?"`)
    - Estado interno: `isCounting` (boolean), `remainingSeconds` (number), `progress` (number 0-100)
    - Usar `useEffect` + `setInterval` (ou `requestAnimationFrame` para suavidade) para decrementar `remainingSeconds` e incrementar `progress`
    - Renderizar `Dialog` (Shadcn) com `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` (mensagem), `DialogFooter`
    - Botão primário com `Progress` (Shadcn) como filho visual — progress bar preenche conforme o tempo passa
    - Botão secundário "Cancelar" chama `onCancel()` e reseta o estado
    - Quando `remainingSeconds` chega a 0, chamar `onConfirm()` automaticamente e fechar o dialog
    - Cleanup do interval/animation frame no unmount para evitar memory leaks
  - [x] Criar `src/features/calendar/components/ethical-delay-button.test.tsx`:
    - Testar renderização do dialog com mensagem correta
    - Testar contagem regressiva (3 → 2 → 1 → 0)
    - Testar progress bar aumentando
    - Testar cancelamento — `onConfirm` NÃO deve ser chamado
    - Testar confirmação automática após 3s — `onConfirm` deve ser chamado uma vez
    - Testar cleanup de timers ao desmontar
    - Mock timers (`vi.useFakeTimers()`)

- [x] **T2 · Integração no DayDetailSheet (AC 1-2)**
  - [x] Atualizar `src/features/calendar/components/day-detail-sheet.tsx`:
    - Importar `EthicalDelayButton`
    - No botão de confirmar evento (atualmente renderizado quando `event.status === 'planning'` e `isOwner`):
      - Se `event.conflictLevel === 'red'`: renderizar `<EthicalDelayButton onConfirm={handleConfirm} onCancel={() => {}} />`
      - Se `event.conflictLevel !== 'red'`: manter botão atual (`Button` simples que chama `handleConfirm` diretamente)
    - `handleConfirm` deve continuar chamando `updateEventStatus(event.id, 'confirmed')` (padrão existente da Story 3.4)
    - Adicionar ícone semântico (Lucide `AlertTriangle` ou `AlertOctagon`) junto ao botão quando `conflictLevel === 'red'` para acessibilidade (UX-DR9)
  - [x] Atualizar `src/features/calendar/components/day-detail-sheet.test.tsx`:
    - Testar que `EthicalDelayButton` é renderizado quando `conflictLevel === 'red'` e `status === 'planning'`
    - Testar que botão simples é renderizado quando `conflictLevel === 'green'` ou `'yellow'`
    - Testar que `EthicalDelayButton` NÃO é renderizado quando `status === 'confirmed'`
    - Mock `EthicalDelayButton` para isolar testes do DayDetailSheet

- [x] **T3 · Toast de confirmação educativa (AC 3)**
  - [x] Atualizar `src/features/calendar/components/ethical-delay-button.tsx`:
    - Após `onConfirm()` ser chamado (delay completado), exibir `toast` (Sonner) com mensagem educativa: `"Evento confirmado. Lembre-se: a consciência coletiva fortalece a cena."`
  - [x] Testar no `ethical-delay-button.test.tsx` que o toast é disparado após confirmação

- [x] **T4 · Testes E2E para delay ético**
  - [x] Criar/estender `e2e/ethical-delay.spec.ts`:
    - **Test 1:** Logar como coletivo, criar evento com conflito RED (seed de evento conflitante pré-existente), abrir DayDetailSheet, clicar "Confirmar", ver dialog com mensagem, aguardar 3s, verificar que evento muda para "Confirmado"
    - **Test 2:** Mesmo cenário, mas clicar "Cancelar" no meio do countdown → evento permanece "Em Planejamento"
    - **Test 3:** Criar evento GREEN → confirmar deve ser instantâneo (sem dialog de delay)
  - [x] Atualizar `e2e/global-setup.ts` se necessário para seed de evento conflitante RED

- [x] **T5 · Regressões e polish**
  - [x] Rodar `npm run type-check` — zero erros
  - [x] Rodar `npm run lint` — zero warnings
  - [x] Rodar `npm test` — todos os testes passam
  - [x] Verificar que DayDetailSheet não quebrou para eventos green/yellow
  - [x] Verificar que `updateEventStatus` continua funcionando (não foi alterada)
  - [ ] ~~Atualizar `MEMORY.md` com decisão de UX~~ (descartado conforme orientação do usuário — decisão documentada neste Dev Agent Record)

---

## Dev Notes

### Relevant architecture patterns and constraints

- **UI-first pattern:** O delay ético é uma camada de UX pura. Ele NÃO altera a Server Action `updateEventStatus` nem a lógica do Conflict Engine. A única função do componente é interceptar o clique do usuário e introduzir uma pausa forçada antes de chamar a action existente.
- **Shadcn Dialog:** Usar o componente `Dialog` do Shadcn UI (já disponível em `src/components/ui/dialog.tsx`). Se não existir, adicionar via `npx shadcn add dialog`.
- **Shadcn Progress:** Usar o componente `Progress` do Shadcn UI (`src/components/ui/progress.tsx`). Se não existir, adicionar via `npx shadcn add progress`.
- **Timers e testes:** Usar `vi.useFakeTimers()` nos testes de componente. No componente real, usar `useEffect` com cleanup rigoroso para evitar `setState` em componente desmontado.
- **Sonner toasts:** O projeto já usa `sonner` para toasts. Importar `toast` de `sonner` para a mensagem educativa pós-confirmação.
- **Accessibility (UX-DR9):** O dialog deve ter `aria-describedby` apontando para a mensagem de alerta. O botão de confirmar deve ter `aria-live="polite"` para anunciar a contagem regressiva a leitores de tela.
- **Zod-first / API wrapper:** Esta story não envolve Server Actions novas — reutiliza `updateEventStatus` da Story 3.4. Nenhuma validação Zod adicional necessária.

### Source tree components to touch

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/features/calendar/components/ethical-delay-button.tsx` | NEW | Componente `EthicalDelayButton` com Dialog, Progress, countdown |
| `src/features/calendar/components/ethical-delay-button.test.tsx` | NEW | Testes de timer, progress, cancel, confirm |
| `src/features/calendar/components/day-detail-sheet.tsx` | UPDATE | Condicional: `EthicalDelayButton` quando `conflictLevel === 'red'`, botão simples caso contrário |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | UPDATE | Testes condicionais de renderização do delay button |
| `e2e/ethical-delay.spec.ts` | NEW | E2E: delay RED, cancelamento, confirmação instantânea GREEN |
| `MEMORY.md` | UPDATE | Decisão UX: delay é camada de UI pura |

### Não modificar sem necessidade

- `src/features/calendar/actions.ts` — `updateEventStatus` já implementa a transição de status. Não alterar.
- `src/features/calendar/logic/evaluate-conflict.ts` — Engine de conflitos não muda.
- `src/features/calendar/logic/visibility.ts` — Regras de privacidade não afetam o delay.
- `src/db/schema/events.ts` — Schema estável.
- `src/features/calendar/validations.ts` — Sem novos schemas.
- Migrations 001-010 — não tocar.

### Testing standards summary

- **Unitários (Vitest + RTL):** `ethical-delay-button.test.tsx` com fake timers. Testar todos os estados do componente (idle, counting, completed, cancelled).
- **Componente (Vitest + RTL):** `day-detail-sheet.test.tsx` — mock de `EthicalDelayButton` para testar apenas a lógica condicional de renderização.
- **E2E (Playwright):** Cenário real de 3s de delay. Playwright lida bem com esperas (`page.waitForTimeout` ou `expect(...).toBeVisible()` com timeout). Testar tanto o caminho feliz (aguarda 3s) quanto o cancelamento.
- **Review adversarial:** 3 camadas obrigatório antes do merge.

### Dependências

- **Possíveis novas dependências de UI:**
  - `npx shadcn add dialog` (se não existir)
  - `npx shadcn add progress` (se não existir)
- **Sem dependências de runtime novas.** O componente usa apenas React, Tailwind CSS, e bibliotecas já presentes (Shadcn, Sonner, Lucide React).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.5] (linhas 436-448 — ACs verbatim)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements] (FR23)
- [Source: _bmad-output/planning-artifacts/prd.md#Inteligência-de-Conflitos] (FR23 — delay de 3s)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy] (UX-DR6 — Ethical Delay Component)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button-Hierarchy] (botão com delay e feedback visual de progresso)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] (UX-DR9 — ícones semânticos + ARIA)
- [Source: _bmad-output/implementation-artifacts/3-4-privacidade-granular-e-status-do-evento.md] (padrões, `updateEventStatus`, `DayDetailSheet`, dev agent record)
- [Source: _bmad-output/implementation-artifacts/3-3-motor-de-regras-algoritmo-v1-2.md] (padrões, `conflictLevel`, dev agent record)
- [Source: src/features/calendar/components/day-detail-sheet.tsx] (ponto de integração do EthicalDelayButton)
- [Source: src/features/calendar/actions.ts] (`updateEventStatus` — Server Action a ser chamada após delay)

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash (via opencode)

### Debug Log References

- **2026-05-05 12:00:** Início da implementação. Story 3-5 em ready-for-dev → in-progress.
- **2026-05-05 12:03:** Primeira tentativa de testes — falha devido a `vi.useFakeTimers()` congelar `setTimeout` do React.
- **2026-05-05 12:06:** Corrigido mock de timers com `{ toFake: ['setInterval', 'clearInterval'] }` + `userEvent` para contornar `@base-ui/react/button` (pointer events).
- **2026-05-05 12:07:** 9/9 testes do componente passando. Suite completa: 371/371.
- **2026-05-05 12:10:** Lint zero, type-check zero. Story finalizada.

### Completion Notes List

**Decisão de UX:** Delay ético é camada de UI pura. A Server Action `updateEventStatus` não foi alterada — o `EthicalDelayButton` apenas intercepta o clique e introduz uma pausa de 3 segundos antes de chamar a action existente.

**Componentes criados:**
1. `ethical-delay-button.tsx` — Componente React reutilizável com Dialog (Shadcn base-nova), Progress (Shadcn), countdown via setInterval (100ms ticks), botão de cancelar, toast educativa via Sonner, e auto-confirmação após 3s
2. `ethical-delay-button.test.tsx` — 9 testes unitários: renderização, contagem regressiva, progress bar, cancelamento, confirmação automática, toast, cleanup

**Integração:**
- `day-detail-sheet.tsx` — Renderização condicional: `EthicalDelayButton` quando `conflictLevel === 'red'`, botão simples caso contrário

**Testes expandidos:**
- `day-detail-sheet.test.tsx` — 4 novos testes: RED+planning, GREEN+planning, YELLOW+planning, confirmed+RED
- `e2e/ethical-delay.spec.ts` — 3 testes E2E: RED (3s → confirmado), RED (cancel → planning), GREEN (sem delay)
- `e2e/global-setup.ts` — Seed de evento RED e GREEN para testes E2E

**Verificações:**
- `npm run type-check` — zero erros
- `npm run lint` — zero warnings
- `npm test` — 371/371 testes passando
- `updateEventStatus` não foi alterada (conforme especificado)
- DayDetailSheet mantém comportamento normal para green/yellow

### File List

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/features/calendar/components/ethical-delay-button.tsx` | NEW | Componente EthicalDelayButton com Dialog, Progress, countdown 3s, toast, ARIA |
| `src/features/calendar/components/ethical-delay-button.test.tsx` | NEW | 9 testes unitários do componente |
| `src/features/calendar/components/day-detail-sheet.tsx` | UPDATE | Integração condicional do EthicalDelayButton para conflictLevel === 'red' |
| `src/features/calendar/components/day-detail-sheet.test.tsx` | UPDATE | 4 novos testes de renderização condicional |
| `e2e/ethical-delay.spec.ts` | NEW | 3 testes E2E: delay, cancelamento, GREEN |
| `e2e/global-setup.ts` | UPDATE | Seed de eventos RED e GREEN para E2E |
| `src/components/ui/progress.tsx` | NEW | Shadcn Progress (instalado via CLI) |

### Review Findings

- **PR:** https://github.com/magalz/agenda-clubber/pull/23
- **Status:** Merged diretamente no `main` via GitHub em 2026-05-05
- **Sem revisões formais** — merge executado sem code review bloqueante
- **Verificações pós-merge:** 371/371 testes passando, lint zero, type-check zero
- **Arquivos:** 11 arquivos tocados (+941 / -15), 3 novos componentes, 3 testes E2E

### Change Log

- 2026-05-05: Implementação completa da Story 3.5 — Componente de Delay Ético para Conflitos Críticos. Componente `EthicalDelayButton` criado com Dialog, Progress, countdown 3s, toast educativa e cancelamento. Integrado ao `DayDetailSheet` para eventos com `conflictLevel === 'red'`. Seed E2E expandido. 371 testes passando, lint zero, type-check zero.
