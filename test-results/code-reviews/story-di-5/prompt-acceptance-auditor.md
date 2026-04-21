# Acceptance Auditor Review — Story DI.5

## Seu Papel

Você é um Acceptance Auditor. Revise o diff abaixo contra a spec (story) e os docs de contexto fornecidos. Verifique:

- Violações de critérios de aceitação
- Desvios da intenção da spec
- Implementação ausente de comportamentos especificados
- Contradições entre as restrições da spec e o código real

**Apresente os findings como uma lista Markdown.** Cada finding deve ter:
- Um título em uma linha
- Qual AC ou restrição é violado
- Evidência do diff

---

## Spec (Story DI.5)

```markdown
# Story DI.5: Supabase Branching e Workflow de Migrações

Status: review

## Story

As a developer,
I want each feature branch to have its own isolated database branch with automated migrations,
so that schema changes can be tested safely without affecting shared development or production databases.

## Pre-requisites

- Supabase CLI already installed locally (confirmed in environment).
- Story DI.4 landed (provides the GitHub Actions workflow to extend).

## Acceptance Criteria

1. **Supabase Branching Enabled:** Supabase Branching enabled on the `agenda-clubber` project via Supabase
   dashboard. Requires Supabase Pro or applicable plan — confirm entitlement before executing.
2. **Automated Branch Lifecycle in CI:** The GitHub Actions workflow from DI.4 is extended to:
   - On PR open/update: create (or ensure exists) a Supabase branch corresponding to the PR
     (`supabase branches create <branch-name>` or via PR GitHub integration).
   - On PR close/merge: delete the Supabase branch (`supabase branches delete <branch-name>`).
3. **Automated Drizzle Migrations:** The CI workflow runs `drizzle-kit push` (or `drizzle-kit migrate`)
   against the PR's Supabase branch before the test/build steps. Migrations run against an ephemeral,
   per-PR database — never against production.
4. **Vercel Preview Uses PR's Supabase Branch:** Vercel Preview Deployments (from DI.4) are configured
   to point their `NEXT_PUBLIC_SUPABASE_URL` and related vars to the PR's Supabase branch. Preview and
   preview-DB are always in sync. (Use Supabase's Vercel integration for automatic wiring.)
5. **Migration Workflow Documented:** Documentation (in `CONTRIBUTING.md` / README following DI.2)
   explains the flow: developer generates migration locally (`drizzle-kit generate`) → commits + pushes
   → CI runs migration against PR Supabase branch → PR merged → migration runs against production DB.
6. **Local Dev Workflow Documented:** Documentation covers local migration commands: `supabase start`
   (if using local Supabase), `drizzle-kit generate`, `drizzle-kit push`, and how to sync a local DB
   with a remote branch if needed.
7. **Production Migration Strategy Defined:** The decision for production migrations (auto-run on merge
   vs. manual approval step) is documented with rationale. Recommended: manual approval via
   workflow_dispatch for early phase, auto-run once confidence is high.
8. **RLS Parity:** Confirm that RLS policies applied via Drizzle/migrations propagate correctly to
   Supabase branches (Supabase Branching replicates schema + RLS from main branch).
```

---

## Contexto de Implementação (Dev Agent Record)

**Decisão arquitetural crítica:** O projeto não tem Supabase Pro, portanto Supabase Branching **não foi implementado**. Em vez disso, adotou-se um banco CI dedicado ("agenda-clubber-ci") compartilhado entre todos os PRs.

**Mapeamento de ACs pela decisão:**
- **AC1 (Supabase Branching):** Substituído por banco CI dedicado — secrets `DATABASE_URL` etc. configurados manualmente pelo usuário
- **AC2 (Branch Lifecycle em CI):** Não implementado — sem criação/deleção de branches por PR
- **AC3 (drizzle-kit migrate em CI):** Implementado via job `db-migrate` no `ci.yml`
- **AC4 (Vercel preview usa banco CI):** Configurado manualmente pelo usuário via secrets do Vercel
- **AC5/6/7 (documentação):** Implementado via `CONTRIBUTING.md`
- **AC8 (RLS parity):** Documentado como validação manual; migrations existentes aplicadas ao banco CI via `drizzle-kit migrate`

---

## Diff a Revisar

```diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000..6628afd
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,48 @@
+name: CI
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+jobs:
+  db-migrate:
+    name: Migrate CI Database
+    if: github.event_name == 'pull_request'
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - name: Apply Drizzle migrations to CI database
+        run: npx drizzle-kit migrate
+        env:
+          DATABASE_URL: ${{ secrets.DATABASE_URL }}
+
+  lint-and-test:
+    name: Lint, Build & Test
+    needs: [db-migrate]
+    if: always() && (needs.db-migrate.result == 'success' || needs.db-migrate.result == 'skipped')
+    runs-on: ubuntu-latest
+    env:
+      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
+      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
+      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
+      SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npm run lint
+      - run: npm run build
+      - run: npx vitest run
+      - name: Install Playwright browsers
+        run: npx playwright install --with-deps chromium
+      - run: npx playwright test --reporter=list

diff --git a/.github/workflows/migrate-prod.yml b/.github/workflows/migrate-prod.yml
new file mode 100644
index 0000000..bf0e437
--- /dev/null
+++ b/.github/workflows/migrate-prod.yml
@@ -0,0 +1,25 @@
+name: Deploy Migrations — Production
+
+on:
+  workflow_dispatch:
+    inputs:
+      confirm:
+        description: 'Digite "deploy" para confirmar a execução das migrations em produção'
+        required: true
+
+jobs:
+  migrate:
+    name: Apply Drizzle migrations to production
+    if: github.event.inputs.confirm == 'deploy'
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - name: Apply Drizzle migrations to production database
+        run: npx drizzle-kit migrate
+        env:
+          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}

diff --git a/CONTRIBUTING.md b/CONTRIBUTING.md
new file mode 100644
index 0000000..d42e4bc
--- /dev/null
+++ b/CONTRIBUTING.md
@@ -0,0 +1,84 @@
+# Contributing
+
+## Database Migrations
+
+Este projeto usa **Drizzle ORM** como source of truth para o schema do banco de dados. As migrações são arquivos SQL versionados gerados pelo `drizzle-kit` e armazenados em `supabase/migrations/`.
+
+### Arquitetura de Ambientes
+
+| Ambiente | Banco Supabase | Quando atualiza |
+|----------|---------------|-----------------|
+| Produção | `agenda-clubber` (principal) | Manual via workflow `Deploy Migrations — Production` |
+| Preview/CI | `agenda-clubber-ci` (dedicado) | Automático a cada PR via GitHub Actions |
+| Local | Docker (Supabase local) ou banco CI | Manual via `drizzle-kit push` |
+
+### Fluxo Local
+
+1. **Editar o schema** em `src/db/schema/*.ts`
+2. **Gerar a migration:**
+   ```bash
+   npx drizzle-kit generate
+   ```
+3. **Revisar** o arquivo SQL gerado em `supabase/migrations/`
+4. **Commitar** os arquivos de schema e migration juntos:
+   ```bash
+   git add src/db/schema/ supabase/migrations/
+   git commit -m "feat: add <table/column description>"
+   ```
+5. **Fazer push** e abrir um PR — o CI aplica a migration automaticamente ao banco CI
+
+#### Comandos úteis
+
+```bash
+# Gerar migration a partir de mudanças no schema
+npx drizzle-kit generate
+
+# Aplicar migrations versionadas (usa os arquivos em supabase/migrations/)
+npx drizzle-kit migrate
+
+# Sincronizar schema diretamente sem migration files (apenas desenvolvimento local)
+npx drizzle-kit push
+
+# Visualizar schema interativamente no browser
+npx drizzle-kit studio
+```
+
+> **Atenção:** Use a Direct URL (porta **5432**), não o Transaction Pooler (porta 6543), para executar migrations. O Pooler não suporta DDL statements.
+
+### Fluxo CI/CD
+
+Ao abrir ou atualizar um PR:
+
+1. O job **`db-migrate`** do GitHub Actions executa `drizzle-kit migrate` contra o banco CI dedicado
+2. O job **`lint-and-test`** aguarda a conclusão das migrations antes de rodar os testes
+3. O Vercel Preview Deployment aponta automaticamente para o banco CI (env vars configurados)
+
+**Limitação conhecida:** O banco CI é compartilhado entre todos os PRs simultâneos. Se dois PRs tiverem migrations conflitantes (ex: ambos adicionam coluna com mesmo nome em tabelas diferentes), pode ocorrer conflito. Para o tamanho atual do time, o risco é aceitável.
+
+### Migrations em Produção
+
+**Estratégia: aprovação manual** (workflow_dispatch).
+
+**Rationale:** Migrations destrutivas (`DROP`, `ALTER` em tabelas com dados) exigem revisão humana. O auto-run é adotado após a equipe ganhar confiança no pipeline. Para a fase MVP, o gate manual é a abordagem correta.
+
+**Passo a passo:**
+
+1. Vá em **GitHub → Actions → "Deploy Migrations — Production"**
+2. Clique em **"Run workflow"**
+3. Digite `deploy` no campo de confirmação
+4. Clique em **"Run workflow"**
+
+> **Pré-requisito:** O secret `PROD_DATABASE_URL` deve estar configurado no repositório (Settings → Secrets → Actions). Use a Direct URL do banco de produção (porta 5432).
+
+### RLS (Row Level Security)
+
+As políticas RLS são definidas diretamente nas migrations SQL (ex: `001_profiles_rls.sql`). O banco CI recebe as mesmas políticas que produção via `drizzle-kit migrate`.
+
+**Para verificar paridade RLS entre ambientes:**
+1. Acesse o Supabase dashboard do banco de produção → Authentication → Policies
+2. Compare com o banco CI → Authentication → Policies
+3. Qualquer diferença indica que uma migration não foi aplicada
+
+### Sobre Supabase Branching
+
+Este projeto usa um banco CI dedicado em vez de Supabase Branching (que requer plano Pro). Caso o projeto migre para o plano Pro no futuro, a configuração do CI pode ser revisitada para usar branches isoladas por PR, eliminando a limitação de banco CI compartilhado.
```

---

## Instruções de Output

Apresente os findings como uma **lista Markdown**. Cada finding deve ter:

- **Título:** uma linha descrevendo o problema
- **AC violado:** referência ao critério de aceitação (ex: "AC3", "AC5", "AC8")
- **Evidência:** trecho do diff ou ausência de trecho que suporta o finding

Inclua findings mesmo para ACs que foram substituídos por estratégia alternativa (banco CI), pois é papel do auditor verificar se a substituição é adequada ou se existem gaps. Considere se a decisão arquitetural é documentada de forma suficiente para um novo desenvolvedor entender o desvio intencional.
