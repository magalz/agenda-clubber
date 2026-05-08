# Story HK.7: Resolver Todos os test.fixme

[Risk: LOW — Apenas alterações em E2E tests, nenhum código de runtime]

Status: ready-for-dev

## Story

As a **developer**,
I want **all 8 skipped E2E tests passing in CI**,
so that **the test suite provides full confidence before Epic 4 begins**.

## Acceptance Criteria

1. **Given** the 2 tests marked `test.fixme(true, 'CI: Supabase unreachable — server action toast never appears')` across `conflict-detection.spec.ts` and `event-registration.spec.ts`
   **When** this story is executed
   **Then** the root cause of "Supabase unreachable" in CI must be identified and fixed
   **And** both server action tests must pass in CI without the `test.fixme` guard

2. **Given** the 3 `public-artist-profile.spec.ts` tests marked `test.fixme` (DEBT-3.2-A — seed flake)
   **When** this story is executed
   **Then** the deterministic seed from HK.4 (`DELETE` + `INSERT` in `global-setup.ts`) must be verified to produce reliable artist data
   **And** all 3 profile tests must pass in CI with `test.fixme` removed

3. **Given** the conflict detection RED/YELLOW/GREEN tests
   **When** this story is executed
   **Then** the RED test must pass in CI (already implemented, just un-skip)
   **And** the YELLOW test must be completed with full form fill → submit → assert flow
   **And** the GREEN test must be completed with full form fill → submit → assert flow
   **And** both must pass in CI

4. **Given** the current test suite
   **When** this story is completed
   **Then** all 422+ unit tests must continue passing
   **And** zero `test.fixme` or `test.skip` must remain in the Playwright E2E suite
   **And** lint (`npm run lint:ci`) and type-check (`npm run type-check`) must pass

## Tasks / Subtasks

### T1 · Remover fixme do teste RED conflict detection (AC 1)

- [ ] T1.1 Remover linha `test.fixme(true, 'CI: Supabase unreachable — server action toast never appears')` em `e2e/conflict-detection.spec.ts:23`
- [ ] T1.2 Verificar que o teste RED completo (fill form → submit → toast → reload → assert `aria-label`) roda localmente com `npm run test:e2e -- --grep "RED: criar evento"`

### T2 · Remover fixme do teste submit event registration (AC 1)

- [ ] T2.1 Remover linha `test.fixme(true, 'CI: Supabase unreachable — server action toast never appears')` em `e2e/event-registration.spec.ts:24`
- [ ] T2.2 Verificar que o teste `submits event and receives server response` roda localmente

### T3 · Completar teste YELLOW conflict detection (AC 3)

- [ ] T3.1 Substituir `test.fixme('YELLOW: criar evento Techno em 6 dias gera conflito amarelo', ...)` por `test(...)` em `e2e/conflict-detection.spec.ts:64`
- [ ] T3.2 Completar implementação seguindo padrão do teste RED:
  - Clicar cell index correspondente a 6 dias da data seed
  - Preencher formulário: nome do evento, local, gênero Techno
  - `dispatchEvent('click')` no botão Salvar
  - Aguardar toast visível (timeout 20s)
  - Recarregar página
  - Verificar `aria-label` contém `/médio risco de conflito/` (YELLOW)

### T4 · Completar teste GREEN conflict detection (AC 3)

- [ ] T4.1 Substituir `test.fixme('GREEN: criar evento com gênero diferente não gera conflito', ...)` por `test(...)` em `e2e/conflict-detection.spec.ts:72`
- [ ] T4.2 Completar implementação:
  - Clicar cell próxima ao seed event
  - Preencher formulário com gênero House (diferente de Techno)
  - `dispatchEvent('click')` no botão Salvar
  - Aguardar toast visível
  - Recarregar página
  - Verificar `aria-label` NÃO contém `/risco de conflito/` (sem conflito de qualquer nível)

### T5 · Remover fixme do teste ethical delay cancel (AC 3)

- [ ] T5.1 Substituir `test.fixme('RED: Cancelar no meio do countdown mantém evento em planejamento', ...)` por `test(...)` em `e2e/ethical-delay.spec.ts:50`
- [ ] T5.2 Verificar que o teste passa localmente

### T6 · Remover fixme dos 3 testes public artist profile — seed flake (AC 2)

- [ ] T6.1 Substituir `test.fixme('renders public profile...', ...)` por `test(...)` em `e2e/public-artist-profile.spec.ts:15`
- [ ] T6.2 Substituir `test.fixme('includes SEO meta title...', ...)` por `test(...)` em `e2e/public-artist-profile.spec.ts:30`
- [ ] T6.3 Substituir `test.fixme('includes SEO meta description...', ...)` por `test(...)` em `e2e/public-artist-profile.spec.ts:41`
- [ ] T6.4 Verificar que os 3 testes passam localmente

### T7 · Verificar regressão unitária

- [ ] T7.1 Rodar `npm run test` e confirmar 422+ testes passam
- [ ] T7.2 Rodar `npm run lint:ci` e confirmar zero warnings
- [ ] T7.3 Rodar `npm run type-check` e confirmar sem erros

### T8 · Verificar CI final

- [ ] T8.1 Submeter PR e verificar pipeline CI completa
- [ ] T8.2 Confirmar que `npm run test:e2e:ci` reporta zero `test.fixme` ou `test.skip`
- [ ] T8.3 Confirmar que o job de QA Gate passa

## Dev Notes

### Current State Analysis (08/05/2026)

**8 `test.fixme` across 4 E2E spec files, grouped into 4 categories:**

| # | Categoria | Arquivo(s) | Qtd | Severidade |
|---|-----------|------------|-----|------------|
| A | Supabase unreachable (CI) | `conflict-detection.spec.ts`, `event-registration.spec.ts` | 2 | blocking |
| B | Testes incompletos | `conflict-detection.spec.ts` | 2 | blocking |
| C | Cancel delay test | `ethical-delay.spec.ts` | 1 | low |
| D | Seed flake DEBT-3.2-A | `public-artist-profile.spec.ts` | 3 | blocking |

### Category A: "Supabase unreachable" — Root Cause

**Tests affected:**
- `conflict-detection.spec.ts:23` — `test.fixme(true, 'CI: Supabase unreachable — server action toast never appears')`
  - INSIDE `test('RED: criar evento Techno próximo ao evento concorrente gera conflito vermelho')` — que já tem corpo completo
- `event-registration.spec.ts:24` — `test.fixme(true, 'CI: Supabase unreachable — server action toast never appears')`
  - INSIDE `test('submits event and receives server response')` — que já tem corpo completo

**IMPORTANTE:** `test.fixme(true, '...')` chamado **dentro** de `test()` é um bug de sintaxe Playwright. `test.fixme()` só funciona como declaração de teste no top-level ou dentro de `test.describe`. Dentro de um `test()` body, ele é executado como código comum mas **não afeta o resultado do teste** — o teste roda e falha se a lógica falhar. Portanto, estes 2 testes já estão rodando em CI (e potencialmente falhando com erro real).

**Hipótese para "Supabase unreachable":**
- `global-setup.ts` conecta-se ao Supabase com sucesso (seeding funciona) em CI
- O build do Next.js em `CI` (`npm run build`) embeda `NEXT_PUBLIC_SUPABASE_URL` no client bundle
- O servidor Next.js (`npm run start`) faz chamadas server action para `NEXT_PUBLIC_SUPABASE_URL`
- A falha pode ser: URL de preview Supabase expirou / ponto de rede entre GH Actions e projeto Supabase
- Possível que HK.4 já tenha resolvido ao usar `drizzle-kit push` + `DELETE` + `INSERT` em vez de workflow customizado

**Ação:** Remover `test.fixme` e rodar CI. Se falhar, diagnosticar com logs adicionais (console.log da URL + status da conexão Supabase no server action).

### Category B: Testes Incompletos — Implementação

**YELLOW test (atual — incompleto):**
```ts
test.fixme('YELLOW: criar evento Techno em 6 dias gera conflito amarelo', async ({ page }) => {
    await page.goto('/dashboard/collective');
    const cells = page.getByTestId('day-cell');
    await expect(cells).toHaveCount(30);
    // FALTA: fill form, submit, verify
});
```

**Implementação necessária (seguir padrão do RED test):**
```ts
test('YELLOW: criar evento Techno em 6 dias gera conflito amarelo', async ({ page }) => {
    await page.goto('/dashboard/collective');
    const cells = page.getByTestId('day-cell');
    await expect(cells).toHaveCount(30);

    // Seed event at today+1. Click today+6 → 5-day delta → YELLOW genre.
    await cells.nth(6).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Amarela');
    await dialog.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');

    await dialog.getByRole('combobox', { name: /genero musical/i }).dispatchEvent('click');
    await page.getByRole('option', { name: 'Techno', exact: true }).click();
    await page.waitForTimeout(300);

    const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.dispatchEvent('click');

    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible({ timeout: 20000 });

    await page.reload();
    await page.waitForTimeout(500);

    const updatedCells = page.getByTestId('day-cell');
    await expect(updatedCells).toHaveCount(30);

    // Cell index 6 should show YELLOW (genre conflict, 5-day window → yellow)
    // aria-label: "15 de maio de 2026 — médio risco de conflito"
    await expect(updatedCells.nth(6)).toHaveAttribute('aria-label', /médio risco de conflito/);
});
```

**GREEN test (atual — incompleto):**
```ts
test.fixme('GREEN: criar evento com gênero diferente não gera conflito', async ({ page }) => {
    await page.goto('/dashboard/collective');
    const cells = page.getByTestId('day-cell');
    await expect(cells).toHaveCount(30);
    // FALTA: fill form, submit, verify
});
```

**Implementação necessária:**
```ts
test('GREEN: criar evento com gênero diferente não gera conflito', async ({ page }) => {
    await page.goto('/dashboard/collective');
    const cells = page.getByTestId('day-cell');
    await expect(cells).toHaveCount(30);

    // Click near seed event but use different genre (House ≠ Techno)
    await cells.nth(2).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Verde');
    await dialog.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');

    // Select House (different from seed's Techno)
    await dialog.getByRole('combobox', { name: /genero musical/i }).dispatchEvent('click');
    await page.getByRole('option', { name: 'House', exact: true }).click();
    await page.waitForTimeout(300);

    const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.dispatchEvent('click');

    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible({ timeout: 20000 });

    await page.reload();
    await page.waitForTimeout(500);

    const updatedCells = page.getByTestId('day-cell');
    await expect(updatedCells).toHaveCount(30);

    // Cell index 2 should NOT have conflict — different genre
    // aria-label would be "15 de maio de 2026 — sem eventos" (null level)
    await expect(updatedCells.nth(2)).not.toHaveAttribute('aria-label', /risco de conflito/);
});
```

### Category C: Ethical Delay Cancel — Fully Implemented

**Teste em `ethical-delay.spec.ts:50` já está completo:**
- Navega para `/dashboard/collective`
- Itera cells procurando "Evento Delay Ético"
- Clica Confirmar → alertdialog aparece
- Espera 1s → clica Cancelar
- Verifica dialog fechou → badge mostra "Em Planejamento"

**Ação:** Apenas trocar `test.fixme` por `test` e verificar.

### Category D: Seed Flake DEBT-3.2-A — Resolvido por HK.4

**Raiz do problema (pré-HK.4):**
- `global-setup.ts` usava `ON CONFLICT DO UPDATE` para seeds
- `EXCLUDED.bio` podia ser `NULL` se o INSERT original não veio com bio
- Resultado: registro "Test DJ" existia mas `bio` era `null` no CI
- Perfil público renderizava sem bio → Playwright não encontrava "Bio do Test DJ"
- Em casos piores: seed não executava e perfil retornava 404

**Resolução (HK.4, T3):**
- Todos os `ON CONFLICT DO UPDATE` substituídos por `DELETE` + `INSERT`
- `global-setup.ts` agora executa `DELETE FROM artists WHERE artistic_name = 'Test DJ'` seguido de INSERT puro com todos os campos incluindo `bio`
- Seed é determinístico independente do estado inicial do banco

**Ação:** Remover `test.fixme` — deve passar em CI agora.

### Arquivos que precisam de atenção (fora do escopo desta story)

- `e2e/global-setup.ts` — Seed já está determinístico (HK.4). Sem alterações.
- `src/app/artists/[slug]/page.tsx` — `cacheComponents:true` + `<Suspense>` causa HTTP 200 em vez de 404 para perfis inexistentes. Já documentado no deferred-work.md. **NÃO afeta os testes desta story** — os testes que verificam 404 usam `getByText('Esta página não foi encontrada.')`, não `toHaveStatus(404)`.

### Nota sobre `test.fixme` vs `test.skip`

- `test.fixme` — correto quando há um bug conhecido. O teste aparece como "expected failures" no report.
- `test.skip` — correto quando o teste não deve rodar (funcionalidade não implementada).
- Neste épico: `test.fixme` foi usado **incorretamente** (dentro de `test()` body) em 2 casos.
- **Regra para dev:** Após HK.7, não deve existir `test.fixme` nem `test.skip`. Se precisar desabilitar temporariamente, usar `test.skip` com issue do GitHub referenciado.

### E2E Test Flow (CI)

1. `global-setup.ts` (seeding) → `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `DATABASE_URL`
2. Next.js build → embeda `NEXT_PUBLIC_SUPABASE_URL` no bundle
3. `npm run start` → servidor Next.js pronto em `http://localhost:3000`
4. Playwright navega para `/dashboard/collective` e interage via UI
5. Server Actions chamam Supabase via `@supabase/ssr` client
6. Toast confirma ação da server action

### Arquivos para diagnosticar se falhar em CI

- `src/features/calendar/actions.ts` — Server Actions de criação de evento (conflict detection)
- `e2e/global-setup.ts` — seed E2E determinístico (DELETE + INSERT, HK.4)
- `.github/workflows/ci.yml` — CI pipeline com `wait-on http://localhost:3000`
- `src/app/artists/[slug]/page.tsx` — artista público com `<Suspense>`

## Architecture Compliance

- **Nenhuma alteração em runtime code:** Apenas arquivos de teste (`e2e/*.spec.ts`)
- **Feature-based:** Testes E2E co-localizados em `e2e/`
- **Naming:** Testes em `kebab-case.spec.ts`, títulos descritivos em português
- **Drizzle-first:** Sem alterações em schemas de banco
- **Zod-first:** Sem alterações em schemas de validação
- **Server Actions:** Sem alterações em `actions.ts` ou `helpers.ts`

## File Structure Requirements

**Files to MODIFY:**

| File | Action | Description |
|------|--------|-------------|
| `e2e/conflict-detection.spec.ts` | UPDATE | Remover 2 fixme + completar YELLOW e GREEN tests |
| `e2e/event-registration.spec.ts` | UPDATE | Remover fixme do submit test |
| `e2e/ethical-delay.spec.ts` | UPDATE | Remover fixme do cancel test |
| `e2e/public-artist-profile.spec.ts` | UPDATE | Remover 3 fixme dos profile/SEO tests |

**No new files. No runtime files.**

## Library / Framework Requirements

| Technology | Version | Usage |
|------------|---------|-------|
| Playwright | ^1.59.1 | E2E test runner |
| Node.js | >=22 | Runtime CI |

## Testing Requirements

- **Unitários (Vitest):** 422+ testes existentes devem continuar passando
- **E2E (Playwright):** Todos os 8 testes habilitados devem passar:
  - 2 conflict detection (RED + YELLOW + GREEN = 3, incluindo o 1 já ativo)
  - 1 event registration submit
  - 1 ethical delay cancel
  - 3 public artist profile (render, SEO title, SEO description)
- **CI:** `npm run test:e2e:ci` deve reportar zero `test.fixme` e zero `test.skip`
- **Lint:** `npm run lint:ci` — zero warnings
- **TypeCheck:** `npm run type-check` — sem erros
- **QA Gate:** `npm run qa:gate` — deve passar

## Previous Story Intelligence

### HK.6 — Migrar Tracking para GitHub Issues

**Learnings relevantes:**
- `_bmad-output/implementation-artifacts/deferred-work.md` deprecado — agora tem `tech-debt.yaml`
- DEBT-3.2-A (seed flake) documentado no `deferred-work.md` → referenciado em comentários dos testes fixme
- Octokit v22 requer Node 18+ (compatível com Node 22 do projeto)
- Scripts em `scripts/` usam `.mjs` (ESM)

### HK.4 — Pipeline CI 2.0 e Unificação DB

**Learnings relevantes:**
- Seed E2E em `global-setup.ts` migrado para `DELETE` + `INSERT` (determinístico)
- CI usa `playwright test` com `retries: 1`, `workers: 1`, `forbidOnly: true`
- `NEXT_PUBLIC_SUPABASE_URL` e `DATABASE_URL` devem apontar para o MESMO projeto Supabase
- Todos os 422+ testes unitários passam — baseline confirmada
- Playwright config hardened: `globalTimeout: 10min`, JUnit reporter

**⚠️ Atenção:** HK.4 já resolveu o seed determinístico que causava DEBT-3.2-A. Se os testes de profile ainda falharem em CI, o problema é outro (provavelmente Supabase preview URL).

### Dependencies & Ordering

- **HK.4 já concluído** — seed determinístico, CI pipeline robusta
- **HK.5 já concluído** — QA Gate operacional
- **HK.6 já concluído** — tracking de débito migrado (DEBT-3.2-A documentado)
- **HK.7 independente** — pode ser feito separadamente
- **Épico 4 bloqueado** até HK.5-7 estarem concluídos

## References

- [Source: epics.md#Epic-Housekeeping] (HK.7 — ACs originais)
- [Source: e2e/conflict-detection.spec.ts] (3 fixme: RED + YELLOW + GREEN)
- [Source: e2e/event-registration.spec.ts] (1 fixme: submit event)
- [Source: e2e/ethical-delay.spec.ts] (1 fixme: cancel countdown)
- [Source: e2e/public-artist-profile.spec.ts] (3 fixme: render + SEO)
- [Source: deferred-work.md] (DEBT-3.2-A — seed flake analysis)
- [Source: hk-4-pipeline-ci-2-0-e-unificacao-db.md] (seed determinístico concluído)
- [Source: hk-6-migrar-tracking-para-github-issues.md] (tech-debt.yaml como fonte verdade)

## Dev Agent Record

### Agent Model Used

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash)

### Debug Log References

- 2 testes usam `test.fixme(true, ...)` DENTRO de `test()` — bug de sintaxe. Correção: remover linha.
- YELLOW e GREEN tests estão incompletos — precisam de fill + submit + assert (copiar padrão do RED test).
- DEBT-3.2-A foi resolvido por HK.4 (seed determinístico). 3 tests de profile devem passar agora.
- Nenhuma alteração necessária em runtime code.

### Completion Notes List

- **Story analysis completed:** 8 test.fixme mapeados em 4 arquivos E2E
- **2 bug de sintaxe:** `test.fixme(true, ...)` dentro de `test()` — não afeta execução
- **2 incompletos:** YELLOW e GREEN conflit detection precisam de implementação
- **1 totalmente implementado:** ethical delay cancel — só remover fixme
- **3 resolvidos por HK.4:** seed flake DEBT-3.2-A — só remover fixme
- **422+ testes unitários:** baseline confirmada pós-HK.3/4

### File List

- `e2e/conflict-detection.spec.ts` — UPDATE: remover 2 fixme, completar 2 tests
- `e2e/event-registration.spec.ts` — UPDATE: remover 1 fixme
- `e2e/ethical-delay.spec.ts` — UPDATE: remover 1 fixme
- `e2e/public-artist-profile.spec.ts` — UPDATE: remover 3 fixme

### Change Log

- 2026-05-08: Story created — HK.7 Resolver Todos os test.fixme. 8 fixme mapeados. Análise de causa raiz completa.

## QA Maturity Checklist

### QA-Design (pré-DS)

- [ ] Acceptance test scaffolds gerados (bmad-testarch-atdd)
- [ ] Estratégia de teste definida (bmad-testarch-test-design)

### QA-Verify (pós-DS)

- [ ] Testes unitários passam (422+)
- [ ] Testes E2E passam (zero fixme/skip)
- [ ] Test-review aprovado (bmad-testarch-test-review)
- [ ] Rastreabilidade ACs → testes verificada (bmad-testarch-trace)
- [ ] Cobertura mínima: 100% ACs
- [ ] Zero regressões nos testes existentes
- [ ] QA Gate Report emitido e anexado ao story file
