# QA Workflow — Agenda Clubber

## Ciclo de Story com Dual-Entry Murat

```
CS → VS
       ↓
  🧪 QA-Design (Murat — entrada 1)
       │
       ↓
  DS (Dev Story)
       ↓
  🧪 QA-Verify (Murat — entrada 2)
       │
       ↓
  CR (Code Review)
       ↓
  Done
```

## Dual-Entry Murat

### QA-Design (pós-VS, pré-DS)

Invocar antes do desenvolvimento, após validação da story:

| Ordem | Comando | Skill | Propósito | Output |
|-------|---------|-------|-----------|--------|
| 1 | `/bmad-tea` → ATDD | `bmad-testarch-atdd` | Gerar scaffolds de acceptance tests red-phase | `_bmad-output/test-artifacts/atdd/atdd-checklist-{story_key}.md` |
| 2 | `/bmad-tea` → Test Design | `bmad-testarch-test-design` | Estratégia de teste com risco e cobertura | `_bmad-output/test-artifacts/test-design/test-design-{story_key}.md` |

### QA-Verify (pós-DS, pré-CR)

Invocar após implementação, antes do code review:

| Ordem | Comando | Skill | Propósito | Output |
|-------|---------|-------|-----------|--------|
| 1 | `/bmad-tea` → Test Review | `bmad-testarch-test-review` | Auditar qualidade dos testes (scoring 0-100) | `_bmad-output/test-artifacts/test-reviews/review-{story_key}.md` |
| 2 | `/bmad-tea` → Trace | `bmad-testarch-trace` | Matriz de rastreabilidade ACs → testes | `_bmad-output/test-artifacts/traceability/trace-{story_key}.md` |
| 3 | `/bmad-tea` → Automate | `bmad-testarch-automate` | Preencher gaps de cobertura | `_bmad-output/test-artifacts/automation/` |
| 4 | QA Gate Report | N/A (consolidado) | Relatório consolidado → alimenta CR | `qa-reports/qa-gate-report.md` |

## QA Gate Report

Gerado automaticamente pelo CI (job `qa-gate`) ou localmente via:

```bash
CI=true npm test && npm run qa:gate
```
> `CI=true` é necessário porque o reporter JUnit do Vitest só é ativado em CI.
> Alternativamente, rode `npm run qa:gate` após uma execução de CI que tenha gerado os reports.

### Thresholds (v1)

| Gate | Threshold |
|------|-----------|
| `minTests` | >= 422 testes |
| `zeroFailures` | 0 falhas |
| `maxSkipped` | <= 8 skips (HK.7 conhecidos) |

### Exemplo de output

```json
{
  "timestamp": "2026-05-07T12:00:00.000Z",
  "combined": { "tests": 430, "failures": 0, "skipped": 5 },
  "gates": {
    "minTests":  { "passed": true, "actual": 430, "threshold": 422 },
    "zeroFailures": { "passed": true, "actual": 0, "threshold": 0 },
    "maxSkipped":  { "passed": true, "actual": 5, "threshold": 8 }
  },
  "verdict": "PASS"
}
```

## Critérios de Aprovação/Reprovação

### Aprovação (QA Gate PASS)
- Todos thresholds de CI atingidos
- Test Review com score >= 70
- Traceability mostra 100% ACs cobertos
- Nenhum P0 aberto

### Reprovação (QA Gate FAIL)
- Qualquer threshold não atingido
- Test Review score < 50
- AC órfão sem teste correspondente
- Regressão em teste existente

## QA Maturity Checklist (obrigatório em toda story nova)

```markdown
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
```
