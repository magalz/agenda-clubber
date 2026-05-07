---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
lastStep: step-04-generate-tests
lastSaved: 2026-05-07T12:31:00-03:00
storyId: HK.5
storyKey: hk-5-gate-de-qa-automatizado
storyFile: _bmad-output/implementation-artifacts/hk-5-gate-de-qa-automatizado.md
atddChecklistPath: _bmad-output/test-artifacts/atdd/atdd-checklist-hk-5.md
generatedTestFiles:
  - atdd/hk-5-qa-gate.scaffold.test.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/hk-5-gate-de-qa-automatizado.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad/bmm/config.yaml
  - _bmad/tea/config.yaml
testFramework: vitest
detectedStack: fullstack
generationMode: ai-generation
executionMode: sequential
---

# ATDD Checklist — HK.5 Gate de QA Automatizado

## Test Strategy Summary

| AC | Cenário | Nível | Prioridade | Arquivo Scaffold |
|----|---------|-------|------------|------------------|
| AC1 | Dual-entry Murat documentado | Unit (doc review) | P0 | `atdd/hk-5-qa-gate.scaffold.test.ts` |
| AC2 | QA Maturity Checklist no template | Unit (template scan) | P0 | `atdd/hk-5-qa-gate.scaffold.test.ts` |
| AC3 | CI job `qa-gate` valida thresholds | Integration (CI sim) | P0 | `atdd/hk-5-qa-gate.scaffold.test.ts` |
| AC3b | Script `qa:gate` local agrega reports | Unit (script test) | P1 | `atdd/hk-5-qa-gate.scaffold.test.ts` |
| AC4 | `docs/qa-workflow.md` existe e completo | Unit (doc review) | P1 | `atdd/hk-5-qa-gate.scaffold.test.ts` |

## Red-Phase Status

- [x] Step 1: Preflight & Context — OK (story loaded, stack: fullstack)
- [x] Step 2: AI Generation Mode — selected (no UI recording needed)
- [x] Step 3: Test Strategy — mapped 5 scenarios across 4 ACs
- [x] Step 4: Scaffolds Generated — `atdd/hk-5-qa-gate.scaffold.test.ts`

## Red-Phase Requirements

- Scaffolds use `describe.skip()` — **RED phase** (fail until activated)
- Each AC has at least one corresponding test
- Input/output matrix documented below

## Input/Output Matrix

| AC | Input (artifact) | Expected Output | Verification |
|----|-----------------|-----------------|--------------|
| AC1 | `docs/qa-workflow.md` | Seções QA-Design + QA-Verify com comandos e diagrama | Doc content assertions |
| AC2 | Story file / template.md | Checklist com ATDD, strategy, coverage, thresholds | Template section assertions |
| AC3 | `.github/workflows/ci.yml` | Job `qa-gate` depende de unit+e2e, publica artifact, falha se threshold | CI config assertions |
| AC3b | `package.json` + `scripts/qa-gate.mjs` | Script `qa:gate` registrado + script executável | Pkg + file assertions |
| AC4 | `docs/qa-workflow.md` | Critérios aprovação/reprovação + exemplos de report | Doc structure assertions |

## Implementation Checklist (derived from flow)

- [ ] T1: Documentar dual-entry Murat com comandos exatos
- [ ] T2: Adicionar QA Maturity Checklist ao template
- [ ] T3: Adicionar job `qa-gate` no CI + script `qa:gate`
- [ ] T4: Criar `docs/qa-workflow.md`
