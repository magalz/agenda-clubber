# Coding Standards: agenda-clubber

> **Status:** Active
> **Versão:** 1.0
> **Responsável:** Aria (Architect)
> **Base:** AIOX Livro de Ouro v4.2

---

## 1. Princípios Fundamentais (AIOX Core)
"**Structure is Sacred. Tone is Flexible.**" - A estrutura de arquivos, nomes de seções e formatos de métricas devem ser seguidos rigorosamente. A comunicação entre agentes e humanos pode variar em tom, mas nunca em precisão técnica.

### 3-Layer Quality Gates
Todo código deve passar pelas três camadas de qualidade:
1.  **LAYER 1: LOCAL (Pre-commit):** Lint, Prettier, TypeScript e Unit Tests (`npm run lint`, `npm run typecheck`, `npm test`).
2.  **LAYER 2: PR AUTOMATION (CI/CD):** CodeRabbit AI review + GitHub Actions (Security scans, integration tests).
3.  **LAYER 3: HUMAN REVIEW (Strategic):** Alinhamento arquitetural e lógica de negócio.

---

## 2. Estrutura do Monorepo
Utilizamos **npm workspaces** para gerenciar as dependências e o link entre pacotes.

-   `apps/web/`: Aplicação Next.js 15 principal.
-   `packages/shared/`: Lógica de negócio compartilhada, tipos globais e o **Conflict Engine**.
-   `supabase/migrations/`: Migrações SQL e políticas de RLS.
-   `docs/stories/`: Histórias de desenvolvimento (Stories) seguindo o template v2.0.

---

## 3. Frontend (Next.js 15 & React)
-   **App Router:** Obrigatório. Use Route Groups `(auth)`, `(dashboard)`, `(public)` para organização.
-   **Server Components First:** Use Client Components (`'use client'`) apenas quando necessário (interatividade, hooks de browser).
-   **Type Safety:** Tipagem rigorosa em TypeScript. Use `packages/shared` para tipos que cruzam a fronteira Client/Server.
-   **Validation:** Use **Zod** para validar todos os inputs de formulários e Server Actions.
-   **Fetch & Mutations:** Prefira **Server Actions** para mutações de dados no Supabase.

---

## 4. Estilização (Tailwind CSS v4)
-   **Theme:** Industrial Dark Mode (conforme definido na Story 1.1).
-   **Naming:** Use classes utilitárias do Tailwind v4. Evite CSS-in-JS ou CSS Modules.
-   **Components:** Mantenha componentes pequenos e focados. Use o padrão `components/ui/` para átomos (botões, inputs) e `components/features/` para organismos.

---

## 5. Backend & Banco de Dados (Supabase)
-   **SQL Migrations:** Toda alteração no banco deve ser feita via migration no diretório `supabase/migrations/`.
-   **RLS (Row Level Security):** **OBRIGATÓRIO** em todas as tabelas. Nenhuma tabela deve estar aberta sem políticas específicas.
-   **SQL Naming:** 
    -   Tabelas: `snake_case` e plural (ex: `events`).
    -   Colunas: `snake_case` singular (ex: `event_date`).
    -   FKs: `table_name_id` (ex: `collective_id`).
-   **Functions & Triggers:** Use apenas para lógica que exige integridade máxima no banco (ex: sync de `auth.users` com `profiles`).

---

## 6. Lógica Compartilhada (Conflict Engine)
O motor de detecção de conflitos de datas e artistas deve residir em `packages/shared`.
-   **DRY:** Se a lógica é usada tanto no Frontend quanto no Database (via triggers ou check constraints), defina a regra de ouro no pacote `shared`.

---

## 7. Integração AIOX & CodeRabbit
-   **Stories:** Devem incluir a seção `🤖 CodeRabbit Integration`.
-   **Reviews:** O `@architect` e o `@dev` devem revisar as sugestões do CodeRabbit, priorizando correções de segurança (CRITICAL/HIGH) e padrões arquiteturais.
-   **Task Execution:** Siga rigorosamente a `Task-First Architecture`. Cada subtarefa concluída deve ser marcada na Story antes do PR.

---

## 8. Comandos de Validação
```bash
# Executar antes de cada commit
npm run lint        # ESLint
npm run typecheck   # TypeScript validation
npm test            # Vitest unit tests
```

---
*Aria, arquitetando o futuro 🏗️*
