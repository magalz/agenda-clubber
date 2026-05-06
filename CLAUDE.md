# Agenda Clubber — Claude Code Rules

## Comandos de Shell

- **Python:** use `python` (NÃO `python3`). Este é um ambiente Windows onde o binário é `python`.
- **Scripts BMad:** execute scripts com `python _bmad/scripts/<script>.py` a partir da raiz do projeto.
- **PowerShell:** use cmdlets nativos (`Get-ChildItem`, `Remove-Item`, etc.) quando sugerir comandos ao usuário.

## Sync Obrigatório ao Início de Sessão

**OBRIGATÓRIO:** Qualquer sessão que acesse artefatos de projeto (sprint-status, story files, planning artifacts) deve executar os comandos abaixo antes de qualquer leitura de estado:

```bash
git fetch origin main
git show origin/main:_bmad-output/implementation-artifacts/sprint-status.yaml
```

Compare com o arquivo local. Se divergirem, use o estado do `origin/main` como fonte de verdade.

**Por quê:** Worktrees divergem silenciosamente do `main` após merges. Sem sync, sessões tomam decisões com dados defasados — como rodar uma retrospectiva com epic marcado como incompleto quando já está done.

## Checklist de Fechamento de Story

Antes de marcar qualquer story como `done` no sprint-status, verificar que o story file tem:

- [ ] `Status: done` no topo do arquivo
- [ ] Todas as tasks com `[x]`
- [ ] `Dev Agent Record` preenchido: modelo usado, plano, notas de conclusão, file list, change log
- [ ] Review Findings preenchido (se houve review)

**Story file incompleto = story não está done.**

## Convenções de Branch

| Prefixo | Uso |
|---------|-----|
| `feat/story-X-Y-descricao` | Implementação de story |
| `fix/descricao` | Bug fix |
| `chore/descricao` | Manutenção |
| `claude/<gerado>` | Worktrees do Claude Code |
