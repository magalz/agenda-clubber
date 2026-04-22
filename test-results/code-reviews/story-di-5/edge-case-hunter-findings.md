{
  "location": ".github/workflows/migrate-prod.yml:13-13",
  "trigger_condition": "Input 'confirm' digitado com espaços ou maiúsculas (ex: 'Deploy')",
  "guard_snippet": "run: |\\n if [ \"$CONFIRM\" != \"deploy\" ]; then exit 1; fi",
  "potential_consequence": "Job é pulado silenciosamente sem alertar o usuário"
},
{
  "location": ".github/workflows/ci.yml:29-29",
  "trigger_condition": "Workflow cancelado manualmente pelo usuário",
  "guard_snippet": "if: !cancelled() && (needs.db-migrate.result == 'success' || needs.db-migrate.result == 'skipped')",
  "potential_consequence": "Job de testes executa desnecessariamente consumindo CI"
},
{
  "location": ".github/workflows/migrate-prod.yml:10-10",
  "trigger_condition": "Execução em produção sem proteção de environment",
  "guard_snippet": "environment: production",
  "potential_consequence": "Qualquer pessoa com write access pode alterar produção"
},
{
  "location": ".github/workflows/ci.yml:24-24",
  "trigger_condition": "Secrets de banco de dados não configurados no GitHub",
  "guard_snippet": "if [ -z \"${{ secrets.DATABASE_URL }}\" ]; then exit 1; fi",
  "potential_consequence": "Falha obscura na execução do drizzle-kit"
}