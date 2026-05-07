# Story HK.5: Gate de QA Automatizado no Ciclo de Story

[Risk: LOW — Process/infrastructure story, no runtime code changes]

Status: ready-for-dev

## Story

As a **developer**,
I want **an automated QA gate integrated into the story lifecycle with dual entry (design + verify)**,
so that **quality issues are caught before code review, preventing post-merge hardening**.

## Acceptance Criteria

1. **Given** the BMad developer workflow (CS → VS → DS → CR)
   **When** a new story enters the cycle
   **Then** Murat (bmad-tea) must be invocável e invocado em **duas entradas**:
   - **QA-Design**: pós-VS, pré-DS — ATDD scaffolds + test strategy
   - **QA-Verify**: pós-DS, pré-CR — test review + traceability + automation + gate report
   **And** both entry points are documentados com comandos específicos

2. **Given** the story file template (`bmad-create-story/template.md`)
   **When** a new story is created
   **Then** a **QA Maturity Checklist** must be embedded in the template
   **And** the checklist must cover: ATDD scaffolds, test strategy, unit coverage, E2E coverage, minimum thresholds, zero regressions, gate report approval

3. **Given** the CI pipeline from HK.4 (`.github/workflows/ci.yml`)
   **When** a PR is opened or updated
   **Then** a **`qa-gate` job** must validate:
   - All unit tests pass (422+ baseline)
   - All E2E tests pass (or only known skips from HK.7)
   - Coverage thresholds are met
   - A QA Gate Report is published as artifact
   **And** CI must fail if the gate fails

4. **Given** the completed QA workflow
   **When** a developer needs to invoke Murat
   **Then** a `docs/qa-workflow.md` must exist with:
   - Diagrama do ciclo com posições de Murat
   - Comandos de invocação (/bmad-tea → menu → opção)
   - Critérios de aprovação/reprovação
   - Exemplos de saída esperada

## Tasks / Subtasks

- [ ] T1 · Configurar Murat com dupla entrada no ciclo de story (AC 1)
  - [ ] T1.1 Definir QA-Design (pós-VS, pré-DS): invocar `/bmad-tea` → `bmad-testarch-atdd` para gerar scaffolds de acceptance tests red-phase
  - [ ] T1.2 Definir QA-Verify (pós-DS, pré-CR): invocar `/bmad-tea` → `bmad-testarch-test-review` + `bmad-testarch-trace` para auditar qualidade e rastreabilidade
  - [ ] T1.3 Garantir que `bmad-testarch-automate` pode ser invocado no QA-Verify para preencher gaps de cobertura
  - [ ] T1.4 Documentar comandos exatos de invocação para cada entrada

- [ ] T2 · Criar QA Maturity Checklist e atualizar template da story (AC 2)
  - [ ] T2.1 Definir checklist com critérios objetivos por nível de maturidade
  - [ ] T2.2 Adicionar checklist ao `C:\Users\magal\.agents\skills\bmad-create-story\template.md`
  - [ ] T2.3 A checklist deve ser preenchida como seção obrigatória em toda story nova

- [ ] T3 · Adicionar QA Check Step no CI Pipeline (AC 3)
  - [ ] T3.1 Adicionar job `qa-gate` no `.github/workflows/ci.yml` — paralelo, após unit-tests + e2e-tests
  - [ ] T3.2 Coletar relatórios JUnit (unit + E2E) e verificar thresholds (≥422 testes pass, 0 regressões)
  - [ ] T3.3 Publicar `qa-gate-report` como artifact do workflow
  - [ ] T3.4 CI deve falhar se QA gate thresholds não forem atingidos
  - [ ] T3.5 Adicionar script `"qa:gate"` no `package.json` que agrega reports locais

- [ ] T4 · Documentar workflow de QA (AC 4)
  - [ ] T4.1 Criar `docs/qa-workflow.md` com diagrama e comandos
  - [ ] T4.2 Incluir critérios de aprovação/reprovação do gate
  - [ ] T4.3 Incluir exemplos de QA Gate Report (output do trace + test-review)
  - [ ] T4.4 Referenciar workflow na sprint-status.yaml ou README

## Dev Notes

### Current State Analysis (07/05/2026)

**BMad Workflow Atual:**
```
CS (bmad-create-story) → VS (validate) → DS (bmad-dev-story) → CR (bmad-code-review)
```
- Sem ponto formal de QA no ciclo
- Code Review é única barreira de qualidade antes do merge
- CI pipeline (HK.4) já roda testes mas não tem gate de qualidade estruturado

**HK.4 Pipeline CI (`.github/workflows/ci.yml`):**
- 5 jobs paralelos: `lint-and-typecheck`, `build`, `db-migrate`, `unit-tests`, `e2e-tests`
- JUnit reporter configurado para GitHub PR annotations
- Cache de `.next` e Playwright browsers
- Timeout: 10 min para E2E suite
- `forbidOnly` e `retries=1` configurados

**Test Baseline (pós-HK.4):**
- ~422+ unit tests (Vitest)
- E2E tests (Playwright) — 8 `test.fixme` conhecidos (HK.7)
- Cobertura: não monitorada atualmente

**Ferramentas de QA Disponíveis (bmad-tea):**

| Skill | Propósito | Entrada |
|-------|-----------|---------|
| `bmad-testarch-atdd` | Generate red-phase acceptance test scaffolds (TDD) | QA-Design |
| `bmad-testarch-test-design` | Create system-level or epic-level test plans | QA-Design |
| `bmad-testarch-test-review` | Review test quality using best practices validation | QA-Verify |
| `bmad-testarch-trace` | Generate traceability matrix and quality gate decision | QA-Verify |
| `bmad-testarch-automate` | Expand test automation coverage for codebase | QA-Verify |
| `bmad-testarch-nfr` | Assess NFRs like performance security and reliability | QA-Verify (opcional) |

**Dual-Entry Murat:**

```
CS → VS
       ↓
  🧪 QA-Design (Murat)
       │ - /bmad-tea → atdd (scaffolds red-phase)
       │ - /bmad-tea → test-design (estratégia)
       ↓
  DS (Dev Story)
       ↓
  🧪 QA-Verify (Murat)
       │ - /bmad-tea → test-review (auditar qualidade)
       │ - /bmad-tea → trace (rastreabilidade ACs)
       │ - /bmad-tea → automate (preencher gaps)
       │ - QA Gate Report
       ↓
  CR (Code Review)
       ↓
  Done
```

### QA Maturity Checklist Template

```markdown
## QA Maturity Checklist

### QA-Design (pré-DS)
- [ ] Acceptance test scaffolds gerados (bmad-testarch-atdd)
- [ ] Estratégia de teste definida (bmad-testarch-test-design)

### QA-Verify (pós-DS)
- [ ] Testes unitários passam (npm test)
- [ ] Testes E2E passam (npm run test:e2e:ci)
- [ ] Test-review aprovado (bmad-testarch-test-review)
- [ ] Rastreabilidade ACs → testes verificada (bmad-testarch-trace)
- [ ] Cobertura mínima: 80% linhas, 100% ACs (trace)
- [ ] Zero regressões nos testes existentes
- [ ] QA Gate Report emitido e anexado ao story file
```

### CI QA Gate Design

**Job `qa-gate` no CI:**
- Executa APÓS `unit-tests` e `e2e-tests` (não paralelo — depende dos resultados)
- Recebe outputs dos jobs antecessores (JUnit XML, HTML report)
- Valida thresholds usando ferramenta agregadora (scripts/qa-gate.ts ou similar)
- Publica `qa-gate-report` como artifact (markdown + JSON)
- Falha o workflow se thresholds não forem atingidos

**Thresholds (v1):**
- `test.count >= 422` (baseline)
- `test.fail == 0` (zero regressões)
- `test.skip <= 8` (apenas HK.7 conhecidos)
- Cobertura: opcional v1 (monitorar apenas, sem threshold)

**Script `package.json`:**
```json
{
  "qa:gate": "node scripts/qa-gate.mjs"
}
```
Script local que agrega reports JUnit da pasta `test-results/` e emite QA Gate Report.

### Project Structure Notes

- `.github/workflows/ci.yml` — CI pipeline existente, receberá job `qa-gate`
- `docs/qa-workflow.md` — novo arquivo de documentação
- `scripts/qa-gate.mjs` — novo script agregador (ou usar ferramenta existente)
- `C:\Users\magal\.agents\skills\bmad-create-story\template.md` — template de story, receberá QA Maturity Checklist
- `_bmad-output/test-artifacts/` — diretório de saída dos relatórios de QA (configurado em tea/config.yaml: test_artifacts)

### Files to Modify

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `.github/workflows/ci.yml` | UPDATE | Adicionar job `qa-gate` após unit+e2e |
| `package.json` | UPDATE | Adicionar script `qa:gate` |
| `C:\Users\magal\.agents\skills\bmad-create-story\template.md` | UPDATE | Adicionar QA Maturity Checklist |
| `docs/qa-workflow.md` | NEW | Documentação do fluxo de QA |
| `scripts/qa-gate.mjs` | NEW | Script de QA Gate (agregador de reports) |

### Architecture Compliance

- **Feature-based:** Documentação em `docs/`, scripts na raiz `scripts/`
- **Naming:** Jobs em `kebab-case`, funções em `camelCase`, scripts em `kebab-case`
- **Drizzle-first:** Nenhuma alteração em schemas de banco
- **Zod-first:** Nenhuma alteração em schemas de validação
- **Server Actions:** Nenhuma alteração em `actions.ts` ou `helpers.ts`
- **BMad-respeitoso:** Não alterar estrutura de agentes ou skills — apenas documentar pontos de invocação

### Library / Framework Requirements

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | >=22 | Runtime CI |
| Playwright | ^1.59.1 | E2E tests (já configurado) |
| Vitest | ^4.1.4 | Unit tests (já configurado) |
| @playwright/test | ^1.59.1 | JUnit reporter (já configurado) |

### Testing Requirements

- **Unitários (Vitest):** 422+ testes existentes devem continuar passando — baseline inalterado
- **E2E (Playwright):** Todos os E2E devem passar (exceto 8 test.fixme conhecidos HK.7)
- **CI Pipeline:** Deve completar em < 12 min (10 min E2E + overhead qa-gate)
- **QA Gate Report:** Deve ser gerado em CI e localmente via `npm run qa:gate`

### CI Pipeline Target State (Pós-HK.5)

```
lint-and-typecheck  ─┐
build               ─┤
db-migrate          ─┤── (paralelo) ─→ unit-tests ─┐
                     │                             ├──→ qa-gate → Done
                     └──→ e2e-tests ────────────────┘
```

O job `qa-gate` depende de `unit-tests` e `e2e-tests`, mas é leve (agregação de reports + validação de thresholds). Não adiciona mais de 30s ao pipeline.

### Dependencies & Ordering

- **HK.4 é pré-requisito concluído** (done) — CI pipeline 2.0 está pronto para receber o gate
- **HK.6 (GitHub Issues)** — independente, pode ser feito em paralelo
- **HK.7 (test.fixme)** — NÃO bloqueia: QA gate pode rodar com skips conhecidos (threshold `skip <= 8`)
- **Epic 4** — bloqueado até HK.5-7 estarem concluídos

### Previous Story Intelligence (HK.4)

**Padrões estabelecidos:**
- CI com 5 jobs paralelos: lint-and-typecheck, build, db-migrate, unit-tests, e2e-tests
- Playwright config: forbidOnly, retries=1 (CI), workers=1 (CI), globalTimeout=10min
- JUnit reporter para PR annotations no GitHub
- Seed E2E determinístico (DELETE + INSERT)

**Aprendizados relevantes para HK.5:**
- CI pipeline está maduro o suficiente para receber gate de QA
- Cache de `.next` e Playwright browsers — essencial manter
- `concurrency: cancel-in-progress` — essencial manter
- O job `qa-gate` deve depender de `unit-tests` e `e2e-tests` (needs:) para ter os reports disponíveis
- Scripts em `scripts/` seguem convenção `.mjs` (ESM modules)

**Débitos conhecidos (não resolver nesta story):**
- HK.6 — Migrar tracking de débito para GitHub Issues
- HK.7 — 8 test.fixme E2E
- Cobertura de código não é monitorada (pode ser adicionada como threshold opcional no qa-gate)

### Git Intelligence (Commits Recentes)

| Commit | Assunto |
|--------|---------|
| `f0558c8` | docs(tracking): mark HK.4 as done |
| `4de54bc` | Merge PR #33: feat/story-hk-4-pipeline-ci-2-0 |
| `4c7f3e3` | HK.3: Limpeza de Dead Code + Code Review |

**Insights:**
- Pipeline CI foi reestruturado em HK.4 — base sólida para adicionar gate
- Nenhuma alteração em runtime code esperada nesta story
- Documentação e scripts de infra são o foco principal

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-Housekeeping] (HK.5 — ACs originais)
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions] (Testing stack: Vitest + Playwright)
- [Source: _bmad-output/implementation-artifacts/hk-4-pipeline-ci-2-0-e-unificacao-db.md] (HK.4 — CI pipeline state, Playwright config)
- [Source: .github/workflows/ci.yml] (CI pipeline — 5 jobs, será estendido)
- [Source: C:\Users\magal\.agents\skills\bmad-create-story\template.md] (Story template — receberá QA Maturity Checklist)
- [Source: _bmad\tea\config.yaml] (TEA config — test_artifacts: _bmad-output/test-artifacts)
- [Source: C:\Users\magal\.agents\skills\bmad-tea\SKILL.md] (Murat — skill e sub-skill list)

## Dev Agent Record

### Agent Model Used

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash)

### Debug Log References

### Completion Notes List

### File List

- `.github/workflows/ci.yml` — UPDATE: adicionar job `qa-gate` dependente de unit-tests + e2e-tests
- `package.json` — UPDATE: adicionar script `qa:gate`
- `C:\Users\magal\.agents\skills\bmad-create-story\template.md` — UPDATE: adicionar QA Maturity Checklist
- `docs/qa-workflow.md` — NEW: documentação do fluxo de QA com diagrama e comandos
- `scripts/qa-gate.mjs` — NEW: script agregador de reports e validação de thresholds

### Change Log

- 2026-05-07: Story created — HK.5 Gate de QA Automatizado. Dual-entry Murat (QA-Design + QA-Verify). CI qa-gate job. QA Maturity Checklist no template. docs/qa-workflow.md.
