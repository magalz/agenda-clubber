---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
lastSaved: 'terça-feira, 14 de abril de 2026'
workflowType: 'testarch-test-design'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
---

# Test Design for Architecture: Agenda Clubber (System-Level)

**Purpose:** Architectural concerns, testability gaps, and NFR requirements for review by Architecture/Dev teams.

**Date:** terça-feira, 14 de abril de 2026
**Author:** Murat (Master Test Architect)
**Status:** Architecture Review Pending
**Project:** agenda-clubber
**PRD Reference:** _bmad-output/planning-artifacts/prd.md
**ADR Reference:** _bmad-output/planning-artifacts/architecture.md

---

## Executive Summary

**Scope:** Validação da estratégia global de QA para o Agenda Clubber, focando no Motor de Conflitos, Privacidade de Dados e Integrações de Mensageria/Mapas.

**Business Context:**
- **Revenue/Impact:** Redução de conflitos em eventos (impacto direto na sustentabilidade financeira dos coletivos).
- **Problem:** Fragmentação da comunicação e choques de datas na cena eletrônica do Nordeste.
- **GA Launch:** MVP em breve.

**Architecture:**
- **Key Decision 1:** Next.js 15+ com Supabase (Auth/DB/RLS).
- **Key Decision 2:** Drizzle ORM para performance em Edge.
- **Key Decision 3:** Algoritmo de Conflitos v1.2 (Lógica customizada).

**Risk Summary:**
- **Total risks**: 5
- **High-priority (≥6)**: 3 riscos críticos exigindo mitigação imediata.
- **Test effort**: ~10 cenários principais (~2-3 semanas para 1 QA/Dev focado).

---

## Quick Guide

### 🚨 BLOCKERS - Team Must Decide

1. **CONT-01: Seeding APIs** - Necessidade de endpoints para injetar estados de artistas e eventos (ex: artista "on-the-fly" antigo) para testes determinísticos. (Owner: Backend)
2. **MOCK-01: Mock Strategy** - Definição clara de como mockar Evolution API (WhatsApp) e Leaflet/OSM no CI. (Owner: Architect/Dev)

---

### ⚠️ HIGH PRIORITY - Team Should Validate

1. **RISK-DATA-01: RLS Audit** - Recomendação de auditoria automatizada de RLS Policies para garantir que dados privados de artistas não vazem. (Owner: Architect)
2. **RISK-BUS-01: Conflict Engine Determinism** - Recomendação de usar MSW e injeção de data/hora para validar o Algoritmo v1.2 sem flakiness. (Owner: Dev)

---

## For Architects and Devs - Open Topics 👷

### Risk Assessment

| Risk ID | Category | Description | Prob | Imp | Score | Mitigation | Owner | Timeline |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **R-01** | **BUS** | Falha no Motor de Conflito (Falso Negativo) | 2 | 3 | **6** | Testes unitários 100% branch coverage na lógica v1.2. | Dev/QA | Sprint 1 |
| **R-02** | **DATA** | Vazamento de dados privados de artistas | 2 | 3 | **6** | Testes de integração de API validando RLS. | Architect | Sprint 1 |
| **R-03** | **TECH** | Instabilidade no Bot de WhatsApp | 3 | 2 | **6** | Mocking da Evolution API e retentativas QStash. | Dev | Sprint 2 |

---

### Testability Concerns and Architectural Gaps

**🚨 ACTIONABLE CONCERNS**

#### 1. Blockers to Fast Feedback
- **Inexistência de Seeding APIs** → Impede o teste de estados complexos (ex: reivindicação de perfil).
- **Dependência de Tempo Real** → A lógica de "janela de 3 dias" precisa de controle temporal no ambiente de teste.

---

### Testability Assessment Summary

- ✅ **Acesso Headless:** Server Actions facilitam testes de lógica sem UI.
- ✅ **Isolamento:** Supabase CLI permite ambientes locais limpos e reprodutíveis.

---

**End of Architecture Document**
