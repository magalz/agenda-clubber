# Agenda Clubber — OpenCode Regras do Projeto

## PRE-FLIGHT CHECK — EXECUTAR ANTES DE QUALQUER AÇÃO

STOP. Antes de planejar, ler artefatos, listar diretórios ou executar qualquer ação no projeto, execute o pre-flight obrigatório:

    npm run session:start

Isso verifica sync com origin/main e carrega todas as customizações BMad.

## COMANDOS DE SHELL

- **Python:** use `python` (NÃO `python3`). Ambiente Windows.
- **Scripts BMad:** execute com `python _bmad/scripts/<script>.py` da raiz do projeto.
- **PowerShell:** use cmdlets nativos (`Get-ChildItem`, `Remove-Item`) ao sugerir comandos ao usuário.
- **Scripts projeto:** executar com `node <script>.mjs` ou `npm run <script>`.

## QA DUAL-ENTRY — OBRIGATÓRIO

Sempre que criar uma story:
1. Execute `bmad-create-story` → gera story file
2. Execute `bmad-tea` → QA-Design: ATDD + Test Design
3. Execute `bmad-dev-story` → implementa

Nunca pular QA-Design. Se os checkboxes do QA-Design no story file estiverem vazios, o dev-story deve bloquear.

## CHECKLIST DE FECHAMENTO DE STORY

- Status: done no topo do story file
- Todas as tasks com [x]
- Dev Agent Record preenchido: modelo, plano, notas, file list, change log
- Review Findings preenchido (se houve review)

Story file incompleto = story não está done.

## DEAD CODE VALIDATION

Antes de remover candidatos de `find_dead_code`, consulte
`docs/memtrace-pitfalls.md` para evitar falsos positivos.
Use `node scripts/validate-dead-code.mjs` para classificar.

## MEMTRACE FEEDBACK

Ao final de qualquer sessão onde ferramentas Memtrace foram usadas
(ou poderiam ter sido), registre feedback:

    /bmad-memtrace-feedback

Isso anexa um entry padronizado em `docs/memtrace-sessions-feedbacks.md`
e registra um episódio externo no graph do Memtrace.

## PR CHECKLIST — OBRIGATÓRIO ANTES DE ABRIR PR

STOP. Nunca abrir PR sem validar localmente primeiro:

1. Certifique-se de que o Supabase Docker está rodando:
   ```
   npx supabase status
   ```

2. Execute a pipeline completa local:
   ```
   npm run ci:local
   ```
   Isso roda: lint → typecheck → build → unit (456) → E2E (42 testes)

3. Só abrir PR se TODOS os passos passarem.

4. Abrir PR:
   ```
   gh pr create --title "tipo(escopo): descrição"
   ```
