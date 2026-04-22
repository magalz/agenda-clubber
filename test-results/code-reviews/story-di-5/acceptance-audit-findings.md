# Acceptance Auditor Review — Story DI.5 Findings

*   **Falta de Isolamento de Banco de Dados por PR (Substituição por Banco Compartilhado)**
    *   **AC violado:** AC1 e AC3 ("each feature branch to have its own isolated database branch", "ephemeral, per-PR database").
    *   **Evidência:** A implementação abandonou as branches efêmeras do Supabase por limitações de plano (Pro). O `CONTRIBUTING.md` evidencia o uso de um banco de dados fixo e compartilhado: *"Limitação conhecida: O banco CI é compartilhado entre todos os PRs simultâneos"*.

*   **Ausência do Lifecycle Automático de Branches no GitHub Actions**
    *   **AC violado:** AC2 ("create (or ensure exists) a Supabase branch", "delete the Supabase branch").
    *   **Evidência:** O diff de `.github/workflows/ci.yml` não contém nenhum comando da CLI do Supabase (`supabase branches create` ou `delete`) atrelado aos eventos de abertura ou fechamento de Pull Requests.

*   **Integração e Roteamento do Vercel Preview Comprometidos**
    *   **AC violado:** AC4 ("Vercel Preview Deployments... configured to point their NEXT_PUBLIC_SUPABASE_URL... to the PR's Supabase branch", "Use Supabase's Vercel integration for automatic wiring").
    *   **Evidência:** Como não há branches dinâmicas, o apontamento do Vercel Preview recaiu para uma configuração estática e manual do banco de CI, falhando na intenção de ter URLs de banco dinâmicas por ambiente de preview geradas automaticamente pela integração Supabase-Vercel.

*   **Documentação Incompleta para o Fluxo de Desenvolvimento Local**
    *   **AC violado:** AC6 ("Documentation covers local migration commands: `supabase start`...").
    *   **Evidência:** O `CONTRIBUTING.md` falha em documentar explicitamente o comando `supabase start`. Ele apenas menciona de forma abstrata "Docker (Supabase local)" na tabela de ambientes, mas a seção de "Comandos úteis" ignora a CLI do Supabase local, listando apenas comandos do `drizzle-kit`.

*   **Verificação de Paridade de RLS Tornou-se Processo Manual**
    *   **AC violado:** AC8 ("Supabase Branching replicates schema + RLS from main branch").
    *   **Evidência:** Devido à ausência do Supabase Branching (que copiaria o RLS de forma garantida na infraestrutura), o diff no `CONTRIBUTING.md` instrui o desenvolvedor a realizar uma validação visual propensa a erro humano: *"Para verificar paridade RLS entre ambientes: 1. Acesse o Supabase dashboard... 2. Compare com o banco CI"*.

*   **Risco Potencial de Vazamento de Ambiente nos Testes CI (`ci.yml`)**
    *   **AC violado:** Restrição Implícita de Isolamento de AC3 ("never against production").
    *   **Evidência:** No `ci.yml`, o job `db-migrate` usa `DATABASE_URL` (banco de CI). No entanto, o job `lint-and-test` não faz override das variáveis e consome `${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}` estaticamente (que tipicamente aponta para Produção). Isso significa que, embora as migrações rodem no banco de CI, os testes End-to-End (Playwright/Vitest) rodando no CI podem acabar apontando acidentalmente para a URL de Produção caso os secrets do repositório não sejam tratados dinamicamente.
