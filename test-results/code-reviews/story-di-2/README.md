---
story: DI.2
title: Prompts de Revisão Adversarial — Documentação de Setup e .env.example
date: 2026-04-20
target_model: gemini-2.5-pro
status: ready
---

# Prompts de Revisão LLM — DI.2

Três prompts adversariais **independentes** para avaliar as mudanças da DI.2 no Gemini.

## Como usar

1. Abra o Gemini (gemini.google.com ou API).
2. **Para cada prompt, use uma conversa NOVA** (limpa) — as perspectivas devem ser independentes.
3. Em cada conversa, comece colando o conteúdo do arquivo do prompt.
4. Onde houver `[COLE O DIFF AQUI]`, cole o conteúdo de `DIFF.patch` (ou rode `git diff HEAD` no worktree).
5. Onde o prompt pedir arquivos específicos, forneça o conteúdo dos arquivos finais do worktree.

## Arquivos

| Arquivo | Papel | O que recebe |
|---------|-------|--------------|
| `prompt-1-edge-case-hunter.md` | **Edge Case Hunter** | Diff + acesso ao projeto (simulado via anexo de arquivos) |
| `prompt-2-blind-test.md` | **Blind Test** | Apenas o diff. SEM spec, SEM contexto, SEM ACs |
| `prompt-3-acceptance-auditor.md` | **Acceptance Auditor** | Diff + story file (ACs) |
| `DIFF.patch` | - | Output de `git diff HEAD` a ser colado nos prompts |

## Ordem sugerida

Roda qualquer ordem — os três são **independentes por design**. O Blind Test deve ser rodado sem jamais mencionar a story ou seus ACs na conversa.

## Depois de rodar

Cole os 3 outputs de volta na sessão Claude Code original. O Claude fará triagem e consolidação em uma única lista priorizada (High / Med / Low).
