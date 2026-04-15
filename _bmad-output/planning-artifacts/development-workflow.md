# Agenda Clubber - Development Readiness Workflow

**Status:** Pronto para Execução
**Contexto de Infra:** Projeto já criado no GitHub, Vercel e Supabase.
**Estratégia de Refinamento:** Just-in-Time (JIT) - Refinar épicos apenas quando for iniciá-los.

---

## Próximos Passos (Ordem de Execução)

### 1. Consulta ao Arquiteto de Testes (Murat / `bmad-tea`)
- **Objetivo:** Validar a estratégia de QA global (Plano de Testes Mestre) para todos os épicos.
- **Foco:** Critérios de qualidade para o Motor de Conflitos e integração com APIs externas.

### 2. Detalhamento da Story 0 (Sync & Base Setup)
- **Ferramenta:** `bmad-create-story`
- **Objetivo:** Sincronizar ambiente local (Supabase CLI, `.env.local`) com o que já foi criado no cloud.
- **Entregável:** Especificação técnica para o primeiro "commit" de estrutura base.

### 3. Desenho da Arquitetura de Testes (`bmad-testarch-test-design`)
- **Objetivo:** Definir mocks para WhatsApp e Mapas, e configurar o framework de testes.
- **Por que:** Garantir que o desenvolvimento funcional comece com suporte de testes automáticos.

### 4. Refinamento Técnico do Épico 1 (Apenas)
- **Ferramenta:** `bmad-create-story` (para cada história do Épico 1)
- **Objetivo:** Transformar as histórias do Épico 1 em especificações de implementação detalhadas.

### 5. Validação Final de Prontidão (`bmad-check-implementation-readiness`)
- **Objetivo:** Gerar o reporte final de conformidade (PRD + Arquitetura + UX + Testes + Histórias).
- **Resultado:** Sinal verde oficial para o início do desenvolvimento.

---
**Nota para a nova sessão:** Para retomar, peça ao agente para ler este arquivo e iniciar pelo **Passo 1**.
