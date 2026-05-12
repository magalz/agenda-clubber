# Agenda Clubber — Regras do Projeto

═══════════════════════════════════════════════════════════
PRE-FLIGHT CHECK — EXECUTAR ANTES DE QUALQUER AÇÃO
═══════════════════════════════════════════════════════════

**STOP.** Antes de planejar, ler artefatos, listar diretórios ou executar
qualquer ação no projeto, execute o pre-flight. Pular esta etapa
é violar instrução explícita do projeto.

Execução preferida (faz pre-flight + resolve customizações):

    npm run session:start

Equivalente manual:

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
MEMTRACE QA GATE — OBRIGATÓRIO
═══════════════════════════════════════════════════════════

Ao final de qualquer implementação (dev-story, bug fix, refactor),
execute o gate de qualidade Memtrace antes de abrir PR:

    1. mcp__memtrace__find_dead_code(repo_id="agenda-clubber")
       → salvar em .claude/dead-code-candidates.json
    2. npm run qa:memtrace
    3. Revisar SUSPECTs se houver
    4. Só prosseguir para PR se o gate passar

Para MCP indisponível: node scripts/validate-dead-code.mjs --file <caminho>

Consulte docs/memtrace-pitfalls.md para falsos positivos estruturais.
Nota: ghosts históricos e path \\?\\ corrigidos no Memtrace v0.3.90+.

═══════════════════════════════════════════════════════════
MEMTRACE FEEDBACK
═══════════════════════════════════════════════════════════

Ao final de qualquer sessão onde ferramentas Memtrace foram
usadas (ou poderiam ter sido), registre feedback:

    /bmad-memtrace-feedback

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
