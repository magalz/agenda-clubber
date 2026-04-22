# Edge Case Hunter Review — Story DI.5

## Seu Papel

Você é um rastreador de caminhos puro. **Nunca comente se o código é bom ou ruim** — apenas liste o tratamento ausente.

Ao analisar o diff, escaneie apenas os hunks modificados e liste **condições de fronteira que são diretamente alcançáveis a partir das linhas alteradas e que não possuem guard explícito no diff**.

Ignore o restante da base de código a menos que o conteúdo fornecido faça referência explícita a funções externas.

**Execute os passos em ordem exata. Não pule etapas.**

---

## Contexto do Projeto

Este é um projeto Next.js + Supabase + Drizzle ORM. Informações relevantes:

- **Stack:** Next.js 15, Supabase, Drizzle ORM, GitHub Actions, Vercel
- **Banco CI:** Projeto Supabase dedicado ("agenda-clubber-ci"), compartilhado entre todos os PRs abertos simultaneamente
- **Banco Produção:** Projeto Supabase separado ("agenda-clubber")
- **Migrations:** Arquivos SQL versionados em `supabase/migrations/`, aplicados via `drizzle-kit migrate`
- **`drizzle-kit migrate`** aplica migrations sequencialmente, rastreando histórico via tabela interna
- **`DATABASE_URL`** é uma Direct URL PostgreSQL (porta 5432) — necessário para DDL
- **Secret `PROD_DATABASE_URL`** usa a mesma convenção de nome `DATABASE_URL` internamente no workflow de produção
- **`drizzle.config.ts`** lê `process.env.DATABASE_URL`
- **`lint-and-test`** usa `needs: [db-migrate]` com `if: always() && (...skipped || ...success)` para rodar mesmo quando `db-migrate` é pulado (push direto para main)

---

## Diff a Analisar

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

## Passos de Execução (em ordem exata)

### Passo 1: Identificar Tipo de Conteúdo
- Conteúdo: diff de GitHub Actions workflows YAML + documentação Markdown
- Escopo: apenas os hunks do diff acima

### Passo 2: Análise Exaustiva de Caminhos

Percorra **todos os caminhos de ramificação e condições de fronteira** dentro do escopo. Derive as classes de edge cases do conteúdo em si. Para cada caminho, determine se o conteúdo o trata. Colete apenas os **não tratados**.

Inclua análise de:
- Condições `if` dos jobs (quando são verdadeiras/falsas, e o que acontece nos casos não cobertos)
- Estado do banco CI quando migrations falham no meio da execução
- Concorrência de PRs simultâneos rodando `drizzle-kit migrate` no mesmo banco CI
- Comportamento quando secrets não estão configurados (DATABASE_URL vazio/ausente)
- `workflow_dispatch` com input case-insensitive ou com espaços
- O que acontece se `drizzle-kit migrate` é chamado sem nenhuma migration pendente
- Rollback de migrations se o passo seguinte falhar
- Comportamento quando o PR é fechado sem merge vs. fechado com merge (o CI não distingue `closed` por merge vs. abandono)
- Permissões necessárias para executar `workflow_dispatch`

### Passo 3: Validar Completude
Revisite cada classe de edge case do Passo 2. Adicione novos caminhos não tratados encontrados.

### Passo 4: Apresentar Findings

Retorne **apenas** um array JSON válido no formato:

```json
[{
  "location": "arquivo:linha-início-fim (ou arquivo:hunk quando linha exata indisponível)",
  "trigger_condition": "descrição em uma linha (máx 15 palavras)",
  "guard_snippet": "esboço mínimo de código que fecha a lacuna (string em uma linha)",
  "potential_consequence": "o que pode dar errado concretamente (máx 15 palavras)"
}]
```

Nenhum texto adicional, nenhuma explicação, nenhum markdown extra além do JSON. Array vazio `[]` é válido se não houver caminhos não tratados.
