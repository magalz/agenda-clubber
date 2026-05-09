# Story HK.6: Migrar Tracking de Débito para GitHub Issues

[Risk: LOW — Process/infrastructure story, no runtime code changes]

Status: done

## Story

As a **developer**,
I want **all technical debt and pending product decisions tracked in GitHub Issues with a programmatic index**,
so that **the team has a single source of truth with proper labeling, prioritization, and automated creation**.

## Acceptance Criteria

1. **Given** the 21 tech debt items (D1-D25), 4 reconstructed items (D15-D18), 5 product decisions (DP1-DP5), and 2 items from `deferred-work.md` (note: D6 covers the DEBT-3.2-A from deferred-work.md — total único = 31)
   **When** this story is executed
   **Then** all 31 items must be created as GitHub Issues with appropriate labels (`tech-debt`, `decision-pending`, severity: `critical`/`high`/`medium`/`low`)
   **And** labels must be created in the repository before issues

2. **Given** the created GitHub Issues
   **When** a developer needs programmatic access to the debt registry
   **Then** a `tech-debt.yaml` index file must exist at `_bmad-output/implementation-artifacts/tech-debt.yaml`
   **And** the YAML must include ALL items with: `id`, `title`, `severity`, `label`, `status` (`open`/`resolved`), `body`
   **And** the YAML must serve as the single source of truth for the issue creation script

3. **Given** the `deferred-work.md` file
   **When** this story is completed
   **Then** `deferred-work.md` must be deprecated with a deprecation notice pointing to GitHub Issues
   **And** a `tech-debt.yaml` reference must replace the manual tracking approach

4. **Given** the need for automated issue creation
   **When** a developer runs `npm run create:tech-debt-issues`
   **Then** a script (`scripts/create-tech-debt-issues.mjs`) must read `tech-debt.yaml`, create labels and issues via Octokit (GitHub API)
   **And** the script must be idempotent — re-running must not create duplicates (match by title)
   **And** a JSON report must be output with URLs of created/verified issues

## Tasks / Subtasks

- [x] T1 · Criar labels no repositório GitHub (AC 1)
  - [x] T1.1 Criar label `tech-debt` (cor `#B60205`) para débitos técnicos
  - [x] T1.2 Criar label `decision-pending` (cor `#FBCA04`) para decisões de produto
  - [x] T1.3 Criar labels de severidade: `critical` (`#E99695`), `high` (`#FF9F1C`), `medium` (`#168700`), `low` (`#CFD3D7`)
  - [x] T1.4 Verificar se labels já existem antes de criar (idempotência)

- [x] T2 · Criar script de automação `scripts/create-tech-debt-issues.mjs` (AC 4)
  - [x] T2.1 Ler `tech-debt.yaml` como fonte de dados
  - [x] T2.2 Autenticar via `GITHUB_TOKEN` (environment variable)
  - [x] T2.3 Criar labels via Octokit is hepens (verificar existência antes)
  - [x] T2.4 Criar issues via `octokit.rest.issues.create()` com title, body, labels
  - [x] T2.5 Verificar duplicatas por título antes de criar (idempotência)
  - [x] T2.6 Gerar relatório JSON com URLs das issues criadas
  - [x] T2.7 Adicionar script `"create:tech-debt-issues"` no `package.json`

- [x] T3 · Criar `tech-debt.yaml` como índice programático (AC 2)
  - [x] T3.1 Listar todos os 31 itens de débito (D1-D25, BH-7, DP1-DP5) *(corrigido: AC 1 listava 32, mas D6 = DEBT-3.2-A — contagem real 31)*
  - [x] T3.2 Mapear severidade para cada item
  - [x] T3.3 Incluir campo `status` (`open`/`resolved`) para itens já endereçados
  - [x] T3.4 Incluir campo `resolution` com referência à story que resolveu

- [x] T4 · Deprecar `deferred-work.md` (AC 3)
  - [x] T4.1 Adicionar deprecation notice no topo de `deferred-work.md`
  - [x] T4.2 Referenciar GitHub Issues + `tech-debt.yaml` como substitutos

## Dev Notes

### Current State Analysis (08/05/2026)

**Problema:** O tracking de débito técnico está fragmentado:
- `deferred-work.md` tem apenas 2 entradas — insuficiente para 32 itens
- Retrospectiva do Épico 3 tem 21 itens listados manualmente (sem indexação)
- D15-D18 estavam ausentes da tabela — reconstruídos do contexto dos story files
- Decisões de produto (5 itens) estão misturadas com tech debt
- Sem labels padronizadas no repositório GitHub

**Inventário Final (32 itens):**

| Fonte | Qtd | Status |
|-------|-----|--------|
| D1-D5 (crítico) | 5 | 4 resolvidos (HK.1, HK.2), 1 aberto (D4) |
| D6-D12 (alto) | 7 | 0 resolvidos, 7 abertos |
| D13-D25 (médio/baixo) | 13 | 1 resolvido (D13, HK.3), 12 abertos |
| DEBT-3.2-A, BH-7 | 2 | 0 resolvidos |
| DP1-DP5 (decisões) | 5 | 0 resolvidos, dependem de stakeholder |
| **Total** | **32** | |

**Itens já resolvidos pelo Housekeeping:**

| Item | Resolvido em | Story |
|------|-------------|-------|
| D1 (updateEvent) | HK.1 | Refatorar DayDetailSheet e updateEvent |
| D2 (DayDetailSheet) | HK.1 | Refatorar DayDetailSheet e updateEvent |
| D3 (RLS divergence) | HK.2 | Corrigir divergência RLS e race condition |
| D5 (Zustand race) | HK.2 | Corrigir divergência RLS e race condition |
| D13 (80 dead code) | HK.3 | Limpeza de Dead Code |

### Label Design

| Label | Cor | Descrição |
|-------|-----|-----------|
| `tech-debt` | `#B60205` | Technical debt item |
| `decision-pending` | `#FBCA04` | Product decision awaiting stakeholder |
| `critical` | `#E99695` | Blocks functionality |
| `high` | `#FF9F1C` | Significant impact |
| `medium` | `#168700` | Moderate impact |
| `low` | `#CFD3D7` | Minor improvement |

### Tech-debt.yaml Schema

```yaml
items:
  - id: D1
    title: "updateEvent — complexidade cognitiva 28, HIGH RISK"
    severity: critical
    label: tech-debt
    status: resolved        # open | resolved
    resolution: "HK.1 — refatorado para complexidade < 15"
    body: |
      ## Description
      Full markdown body for the GitHub Issue.
```

### Script Design (`scripts/create-tech-debt-issues.mjs`)

**Flow:**
1. Read `tech-debt.yaml` from `_bmad-output/implementation-artifacts/`
2. Authenticate with `GITHUB_TOKEN` env var
3. For each label in config: check existence → create if missing
4. For each item: check if issue exists by title → create if missing
5. Output JSON report: `tech-debt-issues-report.json`

**Idempotência:** Match por título exato do GitHub Issue. Se existir, skip.

**Execução:** `npm run create:tech-debt-issues` lê `GITHUB_TOKEN` do ambiente.

### Project Structure Notes

- `_bmad-output/implementation-artifacts/tech-debt.yaml` — NEW: índice programático
- `_bmad-output/implementation-artifacts/deferred-work.md` — DEPRECATE: adicionar notice
- `scripts/create-tech-debt-issues.mjs` — NEW: script de automação
- `package.json` — UPDATE: adicionar script `create:tech-debt-issues`

### Architecture Compliance

- **Feature-based:** Script em `scripts/`, dados em `_bmad-output/`
- **Naming:** Scripts em `kebab-case.mjs`, labels em `kebab-case`
- **Drizzle-first:** Nenhuma alteração em schemas de banco
- **Zod-first:** Nenhuma alteração em schemas de validação
- **Server Actions:** Nenhuma alteração em `actions.ts` ou `helpers.ts`
- **Octokit:** API oficial do GitHub — padrão da indústria

### Library / Framework Requirements

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| `@octokit/rest` | ^21.x | GitHub REST API client |
| Node.js | >=22 | Runtime do script |
| `GITHUB_TOKEN` | env var | Autenticação GitHub |

### Testing Requirements

- **Script dry-run:** Script deve suportar flag `--dry-run` para simular sem criar
- **Idempotência:** Re-executar script não deve criar issues duplicadas
- **Report:** Relatório JSON deve ser gerado mesmo em dry-run

### Dependencies & Ordering

- **HK.5 é pré-requisito concluído** (done) — QA Gate está operacional
- **HK.6 independente** de HK.7 — pode ser feito em paralelo
- **Épico 4 (Epic-4)** bloqueado até HK.5-7 estarem concluídos

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-Housekeeping] (HK.6 — ACs originais)
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-05-05.md#8] (Tech Debt Consolidado — 25 itens)
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] (2 itens adicionais)
- [Source: _bmad-output/implementation-artifacts/hk-5-gate-de-qa-automatizado.md] (HK.5 — padrão de story file)
- [Source: C:\Users\magal\.agents\skills\bmad-create-story\template.md] (Story template)
- [Source: docs/octokit.github.io] (Octokit REST API docs)

## QA Maturity Checklist

### QA-Design (pré-DS)
- [ ] Acceptance test scaffolds gerados (bmad-testarch-atdd)
- [ ] Estratégia de teste definida (bmad-testarch-test-design)

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

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash)

### Debug Log References

- D15-D18 não existiam no retrospectivo original — reconstruídos do contexto dos story files 3.3, 3.4 e PRD/NFR6
- Octokit v21 requer Node.js 18+ — compatível com setup atual (Node 22)
- `npm install --save-dev @octokit/rest` adicionou 16 packages

### Completion Notes List

- **Story analysis completed:** 31 itens mapeados (25 D# items + 5 decisões produto + 1 deferred BH-7). D6 = DEBT-3.2-A → contagem corrigida de 32 para 31.
- **D15-D18 reconstruídos:** D15 (lineup→FK), D16 (city/uf), D17 (audit log), D18 (CR adversarial gate)
- **5 itens já resolvidos** pelo housekeeping (D1, D2, D3, D5, D13) → marcados como `status: resolved`
- **6 labels GitHub criadas:** `tech-debt`, `decision-pending`, `critical`, `high`, `medium`, `low`
- **31 GitHub Issues criadas** (#39 a #69) com labels apropriadas
- **tech-debt.yaml corrigido:** removida duplicata DEBT-3.2-A (já coberta por D6), adicionados campos `status: open` faltantes
- **Bugfix no script:** `parseYaml` corrigido para indentação + `\r\n` + aspas em titles; `extractLabels` corrigido para regex lazy
- **Idempotência verificada:** re-run = 31 skipped, 0 criadas
- **Regressão zero:** 422/422 testes passam, lint limpo (excluindo erro pré-existente no preflight)

### File List

- `_bmad-output/implementation-artifacts/hk-6-migrar-tracking-para-github-issues.md` — UPDATE: story file (checkboxes, status → review)
- `_bmad-output/implementation-artifacts/tech-debt.yaml` — FIX: removida duplicata DEBT-3.2-A, adicionados `status: open` em 20 itens
- `_bmad-output/implementation-artifacts/deferred-work.md` — Deprecado (pré-existente)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE: hk-6 → done
- `scripts/create-tech-debt-issues.mjs` — FIX: parseYaml reestruturado (body guard antes de propriedades), extractLabels corrigido (regex)
- `package.json` — UPDATE: script `create:tech-debt-issues` (pré-existente no merge)

### Change Log

- 2026-05-08: Story created — HK.6 Migrar Tracking de Débito para GitHub Issues. 32 itens inventariados. D15-D18 reconstruídos do contexto. Octokit como ferramenta de automação. tech-debt.yaml como índice programático.
- 2026-05-08: Implementação HK.6 — tech-debt.yaml corrigido (31 itens, status consistentes). Script create-tech-debt-issues.mjs com bugfixes de parse. 6 labels e 31 issues criadas no GitHub. Idempotência verificada. Regressão zero.
- 2026-05-08: Code review findings corrigidos — parseYaml reestruturado (body guard + line re-evaluation), D10 status adicionado, AC 1 corrigido para 31.

## Review Findings (AI)

**Review date:** 2026-05-08
**Review outcome:** Changes Required (addressed in same session)

### Action Items

| Severity | Description | AC/File | Status |
|----------|-------------|---------|--------|
| High | Body content lines with property keywords (title:, label:) override item properties — property parsing should not run in body mode | `scripts/create-tech-debt-issues.mjs` | [x] Resolved — parseYaml reestruturado: `inBody` check antes do parse de propriedades |
| Medium | Line that exits body mode is discarded without re-evaluation — could lose data | `scripts/create-tech-debt-issues.mjs` | [x] Resolved — após `inBody = false`, linha cai no parse de propriedades da mesma iteração |
| Low | D10 missing `status` field in tech-debt.yaml | `tech-debt.yaml` | [x] Resolved — `status: open` adicionado |
| Low | AC 1 states "32 items" but actual unique count is 31 (D6 = DEBT-3.2-A) | Story file | [x] Resolved — AC 1 corrigido para 31 com nota explicativa |

### Deferred Items

| Finding | Justificativa |
|---------|---------------|
| Title regex doesn't support single-quoted/unquoted | YAML atual sempre usa aspas duplas — sem risco |
| `issueExists` sem paginação (>100 issues) | Repo tem 69 issues — sem risco imediato |
| Sem retry em erro de API (rate limit, 500) | Script manual de baixa frequência |

### Execution Log

| Layer | Model | Status |
|-------|-------|--------|
| Blind Hunter | Externo | Findings: 5 (3 resolvidos, 2 deferidos) |
| Edge Case Hunter | Externo | Findings: 8 (0 resolvidos, 5 deferidos, 3 false positives) |
| Acceptance Auditor | Externo | Findings: 4 (1 resolvido, 1 AC corrigido, 2 false positives) |
| Structural Review (YAML) | Externo | Findings: 1 (resolvido) |
