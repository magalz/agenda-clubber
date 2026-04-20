# Agenda Clubber

Plataforma de gestão de agenda e conflitos para a cena musical independente.
Construída com [Next.js](https://nextjs.org), [Supabase](https://supabase.com), [Drizzle ORM](https://orm.drizzle.team) e [shadcn/ui](https://ui.shadcn.com).

---

## Local Setup

**Pré-requisitos:** Node.js >= 18.18 (recomendado: 20+), npm, conta no [Supabase](https://supabase.com).

> Você precisará de um projeto Supabase criado antes de começar.
> Crie um em [database.new](https://database.new).

1. Clone o repositório:

   ```bash
   git clone https://github.com/<seu-usuario>/agenda-clubber.git
   cd agenda-clubber
   ```

2. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha os valores em `.env.local` com as credenciais do seu projeto Supabase
   (Settings → API no dashboard).

4. Instale as dependências:

   ```bash
   npm install
   ```

5. Aplique as migrations do banco de dados:

   ```bash
   npx drizzle-kit push
   ```

   > **Importante:** este comando usa a `DATABASE_URL` do `.env.local`. Para migrations, use a **Direct URL** (porta `5432`) em vez do Transaction Pooler (porta `6543`). Obtenha em Supabase → Settings → Database → Connection string → Direct.

6. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

---

## Commit Conventions

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/).

| Tipo       | Quando usar                               | Exemplo                                                         |
| ---------- | ----------------------------------------- | --------------------------------------------------------------- |
| `feat`     | Nova funcionalidade                       | `feat(auth): adicionar login com magic link`                    |
| `fix`      | Correção de bug                           | `fix(story-1-4): corrigir violações de AC no onboarding`        |
| `chore`    | Manutenção, configs, dependências         | `chore: merge épico devops/infra`                               |
| `docs`     | Documentação apenas                       | `docs: adicionar seção de setup no README`                      |
| `test`     | Adição ou correção de testes              | `test(auth): cobrir edge case de token expirado`                |
| `refactor` | Refatoração sem mudança de comportamento  | `refactor(db): extrair helper de conexão Drizzle`               |
| `style`    | Formatação, lint (sem mudança de lógica)  | `style: corrigir indentação em middleware.ts`                   |

> Inclua o escopo entre parênteses quando relevante: `feat(profile):`, `fix(calendar):`, etc.

---

## Development Workflow (Claude Code Worktrees)

Este projeto usa **git worktrees** para isolar cada story durante o desenvolvimento com Claude Code.

### Ciclo completo de uma story

1. **Crie o worktree** a partir da branch `main`:

   ```bash
   # No Claude Code, use o comando /worktree
   # Isso cria automaticamente uma branch e diretório em .claude/worktrees/
   ```

2. **Implemente a story** no worktree isolado.
   O agente trabalha em `.claude/worktrees/<nome-do-worktree>/` sem afetar `main`.

3. **Abra um Pull Request** da branch do worktree para `main`.

4. **Revisão e merge** — após aprovação, faça merge para `main`.

5. **Delete o worktree** após o merge:

   ```bash
   git worktree remove .claude/worktrees/<nome-do-worktree>
   git branch -D claude/<nome-do-worktree>
   ```

### Convenção de nomenclatura

- Branches de worktree seguem o padrão: `claude/<identificador-unico>`
- Diretórios: `.claude/worktrees/<identificador-unico>/`

### Arquivos de story

Story files ficam em `_bmad-output/implementation-artifacts/` e seguem o padrão:
`<epic>-<numero>-<slug>.md` (ex: `di-2-documentacao-de-setup-e-env-example.md`).

Consulte `_bmad-output/` para PRDs, arquitetura e status do sprint.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Auth + Database:** Supabase (PostgreSQL + Row Level Security)
- **ORM:** Drizzle
- **UI:** shadcn/ui + Tailwind CSS
- **Monitoring:** Sentry (stub — configurar na DI.4)
- **Deploy:** Vercel
