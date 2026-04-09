# Definition of Done (DoD): agenda-clubber

> **Status:** Active
> **Versão:** 1.0
> **Responsável:** Aria (Architect)

---

## 📋 Story Completion Checklist
Uma Story só é considerada "Done" quando todos os itens abaixo forem satisfeitos:

### 1. Funcionalidade e Código
- [ ] Todos os Critérios de Aceitação (AC) foram validados.
- [ ] O código segue o `docs/framework/coding-standards.md`.
- [ ] Não há "hardcoded" secrets ou API keys (use `.env`).
- [ ] Tipagem TypeScript completa (sem `any` desnecessário).

### 2. UI/UX
- [ ] A interface segue o `docs/framework/ui-standards.md`.
- [ ] Design responsivo validado (Mobile/Desktop).
- [ ] Contraste e acessibilidade básica verificados.

### 3. Qualidade (3-Layer Gates)
- [ ] **Layer 1:** `npm run lint` e `npm run typecheck` passam localmente.
- [ ] **Layer 1:** Testes unitários (se aplicável) passam.
- [ ] **Layer 2:** Pull Request criado e CI (Quality Gates) passou sem erros.
- [ ] **Layer 2:** Revisão do CodeRabbit analisada e pontos críticos corrigidos.

### 4. Segurança e Banco de Dados
- [ ] RLS (Row Level Security) habilitado e testado para novas tabelas.
- [ ] Migrações SQL documentadas em `supabase/migrations/`.

### 5. Documentação
- [ ] `README.md` atualizado se houver mudanças na infraestrutura.
- [ ] Change Log da Story preenchido com data e autor.
- [ ] File List da Story atualizada.

---
*Aria, garantindo a excelência técnica 🏛️*
