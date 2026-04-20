Aqui está o relatório de caça aos *edge cases*, focado na experiência real de um desenvolvedor (humano ou LLM) tentando configurar o repositório a partir do zero.

### Tabela de Descobertas

| # | Severidade | Categoria | Descrição | Evidência (linha do diff ou do arquivo) | Sugestão |
|---|-----------|-----------|-----------|------------------------------------------|----------|
| 1 | **High** | A | **Falta da execução de migrations:** Seguindo estritamente as instruções de setup, o dev conectará a um banco recém-criado (`database.new`) sem schema. Quando iniciar com `npm run dev`, qualquer requisição ao BD falhará, simulando um projeto quebrado. | `README.md` (diff linhas 19-33) — Pula de `npm install` direto para `npm run dev` | Adicionar um passo intermediário explícito (ex: `npm run db:push` ou `npm run db:migrate`) antes de rodar a aplicação. |
| 2 | **Med** | B | **Armadilha do Transaction Pooler:** O `DATABASE_URL` fornecido usa a porta `6543` (transaction pooler). Fazer migrations do Drizzle usando uma conexão com pooler frequentemente falha por conta de prepared statements. O Drizzle normalmente exige a Direct URL (`5432`). | `.env.example` (diff linha 30): `@aws-0-<region>.pooler.supabase.com:6543` | Instruir o uso do *Session Pooler* (`pgbouncer=true`) ou indicar que localmente para migrations é melhor usar a conexão direta (porta `5432`). |
| 3 | **Med** | B | **Variáveis do Sentry ativas como lixo:** As chaves do Sentry estão descomentadas. Ao fazer o `cp`, o ambiente local receberá strings inválidas (ex: `https://<key>@o<org-id>...`). Isso pode quebrar silenciosamente a build do Next.js ou o SDK do Sentry que tentará realizar requests para o DSN fictício no boot. | `.env.example` (diff linhas 43-46) | Comentar essas linhas por padrão (ex: `# NEXT_PUBLIC_SENTRY_DSN=...`), permitindo que a aplicação faça bypass suave do Sentry localmente, mantendo a documentação no arquivo. |
| 4 | **Med** | C | **Falha na deleção de Worktree:** Se a PR for aprovada e o merge feito no GitHub (Squash/Merge), o commit local na branch do worktree divergirá da `main`. O `git branch -d` falhará informando que a branch não foi mesclada (pois não foi localmente). | `README.md` (diff linha 77): `git branch -d claude/<nome>` | Atualizar para `git branch -D` (deleção forçada) ou instruir a fazer `git checkout main && git pull` primeiro. |
| 5 | **Low** | A | **Dependência fantasma do Node:** A stack usa Next.js 15 (exige Node >= 18.18). Um dev com Node antigo tentará o `npm install` e receberá erros estranhos, ou falhará na compilação do Next.js. | `README.md` (diff seção "Local Setup") | Adicionar bloco de Pré-requisitos informando a versão mínima do Node (ex: `Node.js >= 20`). |
| 6 | **Low** | D | **Silêncio no fallback para o BD Local:** O código possui um fallback no ORM (`src/db/index.ts`) apontando para `localhost:54322` caso `DATABASE_URL` não seja encontrado. Mas o README não menciona a possibilidade de rodar via CLI local, apenas Remote. Se o usuário errar o nome do `.env.local` na cópia, o app vai tentar conectar no localhost sem avisar o erro. | Discrepância entre `src/db/index.ts` e `README.md`. | Adicionar um simples alerta no boot ou mencionar que, sem a var, ele fará fallback pra instância do `supabase local`. |

---

### Análise de Riscos (Probabilidade × Impacto)

- 🔴 **Crash Imediato por Banco Vazio** *(Probabilidade: 100% / Impacto: Alto)*
  Qualquer desenvolvedor novo que use o Cloud (`database.new`) sem rodar o CLI do Supabase para migrações ou o Drizzle, achará que o código do projeto está quebrado logo no primeiro clique na UI, gerando confusão sobre a estabilidade do repositório.
- 🟠 **Bloqueio nas Migrations por causa do Pooler** *(Probabilidade: Alta / Impacto: Médio)*
  Quando o desenvolvedor finalmente perceber que precisa rodar a migration (ex: usando `drizzle-kit push`), receberá *timeouts* ou erros de transaction por estar usando a porta `6543`, levando-o a debugar problemas inexistentes de ORM.
- 🟡 **Erro de Inicialização (Sentry Dummy)** *(Probabilidade: Alta / Impacto: Baixo)*
  Pode lançar warnings contínuos no console em dev ou até crashes dependendo da rigidez do pacote `sentry/nextjs` ao tentar dar parse em `https://<key>...`.
