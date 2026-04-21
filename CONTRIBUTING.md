# Contributing

## Database Migrations

Este projeto usa **Drizzle ORM** como source of truth para o schema do banco de dados. As migrações são arquivos SQL versionados gerados pelo `drizzle-kit` e armazenados em `supabase/migrations/`.

### Arquitetura de Ambientes

| Ambiente | Banco Supabase | Quando atualiza |
|----------|---------------|-----------------|
| Produção | `agenda-clubber` (principal) | Manual via workflow `Deploy Migrations — Production` |
| Preview/CI | `agenda-clubber-ci` (dedicado) | Automático a cada PR via GitHub Actions |
| Local | Docker (Supabase local) ou banco CI | Manual via `drizzle-kit push` |

### Fluxo Local

1. **(Opcional) Iniciar Supabase local** — requer Docker:
   ```bash
   npx supabase start
   ```
   O banco local fica disponível em `postgresql://postgres:postgres@localhost:54322/postgres` (já configurado como fallback no `drizzle.config.ts`).
2. **Editar o schema** em `src/db/schema/*.ts`
3. **Gerar a migration:**
   ```bash
   npx drizzle-kit generate
   ```
4. **Revisar** o arquivo SQL gerado em `supabase/migrations/` — inclua políticas RLS manualmente se necessário (ver seção RLS abaixo)
5. **Commitar** os arquivos de schema e migration juntos:
   ```bash
   git add src/db/schema/ supabase/migrations/
   git commit -m "feat: add <table/column description>"
   ```
6. **Fazer push** e abrir um PR — o CI aplica a migration automaticamente ao banco CI

#### Comandos úteis

```bash
# Iniciar Supabase local (Docker obrigatório)
npx supabase start

# Parar Supabase local
npx supabase stop

# Gerar migration a partir de mudanças no schema
npx drizzle-kit generate

# Aplicar migrations versionadas (usa os arquivos em supabase/migrations/)
npx drizzle-kit migrate

# Sincronizar schema diretamente sem migration files (apenas desenvolvimento local)
npx drizzle-kit push

# Visualizar schema interativamente no browser
npx drizzle-kit studio
```

> **Atenção:** Use a Direct URL (porta **5432**), não o Transaction Pooler (porta 6543), para executar migrations. O Pooler não suporta DDL statements.

### Fluxo CI/CD

Ao abrir ou atualizar um PR:

1. O job **`db-migrate`** do GitHub Actions executa `drizzle-kit migrate` contra o banco CI dedicado
2. O job **`lint-and-test`** aguarda a conclusão das migrations antes de rodar os testes
3. O Vercel Preview Deployment aponta automaticamente para o banco CI (env vars configurados)

**Limitação conhecida:** O banco CI é compartilhado entre todos os PRs simultâneos. Se dois PRs tiverem migrations conflitantes (ex: ambos adicionam coluna com mesmo nome em tabelas diferentes), pode ocorrer conflito. Para o tamanho atual do time, o risco é aceitável.

### Migrations em Produção

**Estratégia: aprovação manual** (workflow_dispatch).

**Rationale:** Migrations destrutivas (`DROP`, `ALTER` em tabelas com dados) exigem revisão humana. O auto-run é adotado após a equipe ganhar confiança no pipeline. Para a fase MVP, o gate manual é a abordagem correta.

**Passo a passo:**

1. Vá em **GitHub → Actions → "Deploy Migrations — Production"**
2. Clique em **"Run workflow"**
3. Digite `deploy` no campo de confirmação
4. Clique em **"Run workflow"**

> **Pré-requisito:** O secret `PROD_DATABASE_URL` deve estar configurado no repositório (Settings → Secrets → Actions). Use a Direct URL do banco de produção (porta 5432).

### RLS (Row Level Security)

> **Importante:** `drizzle-kit generate` gera apenas DDL de tabelas e índices — **não cria políticas RLS automaticamente**. Se a sua mudança de schema exige novas políticas RLS, você deve escrevê-las manualmente no arquivo SQL gerado em `supabase/migrations/` antes de commitar.

As políticas RLS existentes no projeto (ex: `001_profiles_rls.sql`) são arquivos SQL puros. O banco CI recebe as mesmas políticas que produção via `drizzle-kit migrate`.

**Para verificar paridade RLS entre ambientes:**
1. Acesse o Supabase dashboard do banco de produção → Authentication → Policies
2. Compare com o banco CI → Authentication → Policies
3. Qualquer diferença indica que uma migration não foi aplicada

### Sobre Supabase Branching

Este projeto usa um banco CI dedicado em vez de Supabase Branching (que requer plano Pro). Caso o projeto migre para o plano Pro no futuro, a configuração do CI pode ser revisitada para usar branches isoladas por PR, eliminando a limitação de banco CI compartilhado.
