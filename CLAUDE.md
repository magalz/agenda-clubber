# Agenda Clubber — Regras do Projeto

═══════════════════════════════════════════════════════════
PRE-FLIGHT CHECK — EXECUTAR ANTES DE QUALQUER AÇÃO
═══════════════════════════════════════════════════════════

**STOP.** Antes de planejar, ler artefatos, listar diretórios ou executar
qualquer ação no projeto, execute a sequência abaixo. Pular esta etapa
é violar instrução explícita do projeto.

Pode ser feito manualmente (comandos abaixo) ou via script automatizado:

    npm run preflight

───────────────────────────────────────────────────────────
Passo 1 — Obter estado remoto
───────────────────────────────────────────────────────────

    git fetch origin main
    ORIGIN_MAIN=$(git rev-parse origin/main)

───────────────────────────────────────────────────────────
Passo 2 — Comparar main local com remote
───────────────────────────────────────────────────────────

    LOCAL_MAIN=$(git rev-parse main)

Se LOCAL_MAIN != ORIGIN_MAIN → a main local está defasada.
Listar os commits que faltam:

    git log --oneline main..origin/main

⚠ AVISAR ao usuário: "Main local está N commit(s) atrás do
origin/main. Commits: <lista>". Verificar também se há
arquivos modificados não commitados (git status --short).

PERGUNTAR ao usuário: "Quer fazer git pull origin main agora
ou prefere outra ação?" Só prosseguir após resposta.

───────────────────────────────────────────────────────────
Passo 3 — Checar se worktree está sync com main
───────────────────────────────────────────────────────────

    git merge-base --is-ancestor main HEAD

Se o comando falhar (exit code != 0) → HEAD não contém main.
⚠ AVISAR: "Branch atual não contém o HEAD de main."

PERGUNTAR ao usuário: "Quer fazer rebase/merge com main agora?"

───────────────────────────────────────────────────────────
Passo 4 — Atualizar sprint-status como fonte de verdade
───────────────────────────────────────────────────────────

    git show origin/main:_bmad-output/implementation-artifacts/sprint-status.yaml

Comparar com o arquivo local. Se divergirem, o estado do
origin/main é a fonte de verdade — NUNCA tomar decisão com
sprint-status desatualizado.

═══════════════════════════════════════════════════════════
Por quê?
═══════════════════════════════════════════════════════════

Branches e worktrees divergem silenciosamente do main após
merges no GitHub. Sem este pre-flight, agentes tomam decisões
com dados defasados — como implementar story já feita, ignorar
débito já migrado, ou rodar retrospectiva com epic incompleto.

═══════════════════════════════════════════════════════════
COMANDOS DE SHELL
═══════════════════════════════════════════════════════════

- **Python:** use `python` (NÃO `python3`). Ambiente Windows, binário é `python`.
- **Scripts BMad:** execute com `python _bmad/scripts/<script>.py` da raiz do projeto.
- **PowerShell:** use cmdlets nativos (`Get-ChildItem`, `Remove-Item`) ao sugerir comandos ao usuário.
- **Scripts projeto:** executar com `node <script>.mjs` ou `npm run <script>`.

═══════════════════════════════════════════════════════════
CHECKLIST DE FECHAMENTO DE STORY
═══════════════════════════════════════════════════════════

Antes de marcar story como `done` no sprint-status, verificar:

- [ ] `Status: done` no topo do story file
- [ ] Todas as tasks com `[x]`
- [ ] Dev Agent Record preenchido: modelo, plano, notas, file list, change log
- [ ] Review Findings preenchido (se houve review)

Story file incompleto = story não está done.

═══════════════════════════════════════════════════════════
CONVENÇÕES DE BRANCH
═══════════════════════════════════════════════════════════

| Prefixo | Uso |
|---------|-----|
| `feat/story-X-Y-descricao` | Implementação de story |
| `fix/descricao` | Bug fix |
| `chore/descricao` | Manutenção |
| `docs/descricao` | Documentação |
| `claude/<gerado>` | Worktrees do Claude Code |
