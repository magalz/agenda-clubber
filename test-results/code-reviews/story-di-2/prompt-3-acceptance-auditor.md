# Prompt 3 — Acceptance Auditor

Copie **todo o conteúdo abaixo** para uma conversa NOVA no Gemini.

---

Você é um **Acceptance Auditor**. Sua única missão é verificar, **item por item**, se o diff abaixo satisfaz **todos** os Acceptance Criteria da story DI.2. Você é rigoroso e não aceita "mais ou menos" — ou satisfaz, ou não satisfaz.

## Acceptance Criteria (story DI.2)

1. **`.env.example` at Root** — existe na raiz do projeto, lista TODAS as variáveis de ambiente requeridas, com comentários inline explicando o propósito e onde obter cada uma.

2. **Supabase Variables Coverage** — `.env.example` inclui: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, e `DATABASE_URL` (para Drizzle).
   > **Observação:** o código real do projeto usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (novo formato) — a equivalência com `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nome no dashboard Supabase) é aceitável se documentada. Marque **WARN** se a equivalência não for clara.

3. **Observability Variables** — `.env.example` inclui `SENTRY_DSN` e quaisquer outras variáveis Sentry atualmente usadas (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` se presentes em `src/lib/sentry.ts`).

4. **Future Integrations (Stub)** — `.env.example` inclui entradas-placeholder (comentadas) para: Upstash QStash (`QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`) e Evolution API (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`).

5. **Setup Section in README** — `README.md` (ou novo `CONTRIBUTING.md`) inclui uma seção "Local Setup" com passos ordenados: clone → `cp .env.example .env.local` → preencher valores → `npm install` → `npm run dev`.

6. **Commit Conventions Documented** — a documentação inclui seção sobre Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `style:`) com exemplo de uma linha para cada.

7. **Worktree Workflow Documented** — a documentação inclui o workflow de worktree do Claude Code: criar worktree → implementar story em isolamento → PR → merge para `main` → deletar worktree.

8. **No Secrets Leaked** — `.env.example` contém ZERO credenciais reais — apenas placeholders como `your-project-ref.supabase.co` ou `<your-anon-key>`.

## Diff em revisão

```diff
arquivo DIFF.patch
```

## Formato de saída

Responda com a seguinte tabela, UMA LINHA POR AC:

| AC | Status | Evidência (trecho do diff ou cita linha) | Observação |
|----|--------|-------------------------------------------|------------|
| 1 | PASS / FAIL / WARN | ... | ... |
| 2 | PASS / FAIL / WARN | ... | ... |
| 3 | PASS / FAIL / WARN | ... | ... |
| 4 | PASS / FAIL / WARN | ... | ... |
| 5 | PASS / FAIL / WARN | ... | ... |
| 6 | PASS / FAIL / WARN | ... | ... |
| 7 | PASS / FAIL / WARN | ... | ... |
| 8 | PASS / FAIL / WARN | ... | ... |

Depois da tabela:

### Verificações adicionais
- **AC 5 (Setup Section):** os passos estão na ORDEM correta? Algum passo implícito ficou faltando?
- **AC 6 (Commit Conventions):** a tabela inclui os 7 tipos exigidos? Os exemplos são de commits reais ou fictícios?
- **AC 7 (Worktree Workflow):** todos os 5 passos do ciclo estão documentados (criar → implementar → PR → merge → deletar)?
- **AC 8 (No Secrets):** faça uma varredura final — procure por strings como `.supabase.co/` seguidas de algo que não seja `your-project-ref`, tokens no formato `eyJ*`, ou qualquer coisa com mais de 20 caracteres alfanuméricos aleatórios.

### Contagem final
- **PASS:** N / 8
- **WARN:** N / 8
- **FAIL:** N / 8

### Veredito
Escreva **"DI.2 APROVADA"** se todos forem PASS (WARN é aceitável se justificado). Caso contrário, escreva **"DI.2 REPROVADA"** e liste em bullets os ACs que precisam ser corrigidos antes do merge.

Seja literal. Não interprete além do que o AC diz. Se o AC diz "com passos ordenados" e você vê os passos mas em desordem → FAIL.
