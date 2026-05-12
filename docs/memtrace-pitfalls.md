# Memtrace Pitfalls — Catálogo de Falsos Positivos Conhecidos

Antes de remover qualquer candidato de `find_dead_code`, verifique contra este catálogo.

## 1. Dispatch Dinâmico via Record/Map

Memtrace não detecta chamadas via lookup de chave em Record ou Map — a resolução é runtime, não AST.

| Exemplo | Arquivo | Padrão |
|---------|---------|--------|
| `buildGenreJustification`, `buildNonLocalArtistJustification`, `buildLocalSaturationJustification` | `justifications.ts` | `BUILDERS[h.rule](h)` — dispatch via Record em `evaluate-conflict.ts:64` |

**Como validar:** grep pelo nome da função nos arquivos que fazem dispatch.

## 2. Função Passada como Valor

Memtrace rastreia call edges (`fn()`). Função passada como valor (referência, não chamada) não conta como uso.

| Exemplo | Arquivo | Padrão |
|---------|---------|--------|
| `CopyIcon` | `code-block.tsx` | `useState(CopyIcon)` — função como valor inicial |

**Como validar:** grep por `useState(NomeDaFuncao)`, `useCallback(NomeDaFuncao)`, props que recebem função.

## 3. Framework Entry Points

Funções invocadas pelo runtime (Next.js, Playwright, etc.) não têm callers no código da aplicação.

| Exemplo | Arquivo | Invocado por |
|---------|---------|-------------|
| `handler` | `route.ts` (API routes) | Next.js runtime |
| `globalSetup` | `e2e/global-setup.ts` | Playwright config |
| `middleware` | `middleware.ts` | Next.js runtime |

**Como validar:** Verificar se o arquivo está numa estrutura de framework (`app/api/*/route.ts`, `middleware.ts`, `playwright.config.ts`).

## 4. MSW (Mock Service Worker) Handlers

Handlers registrados via `setupServer`/`setupWorker` não são chamados diretamente pelo código.

| Exemplo | Arquivo |
|---------|---------|
| `GET https://maps.googleapis.com/*` | `msw.ts` |
| `POST https://graph.facebook.com/v19.0/*/messages` | `msw.ts` |

**Como validar:** Verificar se está em arquivo de setup de teste (`.msw.ts`, `mocks/`, `test-utils/`).

## 5. Vitest Mocks

Implementações mock registradas no setup do Vitest.

| Exemplo | Arquivo |
|---------|---------|
| `observe`, `unobserve`, `disconnect` | `vitest.setup.ts` (IntersectionObserver mock) |

**Como validar:** Verificar se está em `vitest.setup.ts` ou similar.

## 6. Ghosts Históricos ✅ RESOLVIDO v0.3.90+

O bug de ghosts históricos foi **corrigido upstream na v0.3.90**. O `find_dead_code` agora filtra por HEAD por padrão, excluindo símbolos de commits antigos.

- Símbolos removidos (ex: 17 exports Shadcn do HK.3) **não aparecem mais** no `find_dead_code`
- Para restaurar o comportamento antigo (incluir históricos), passe `include_historical: true`
- O validador ainda mantém a classificação GHOST como safety net residual

---

## Fluxo de Validação

1. Rode `mcp__memtrace__find_dead_code(repo_id="agenda-clubber")`
2. Passe o output para `node scripts/validate-dead-code.mjs --file <candidates.json>`
3. Revise apenas os `SUSPECT` — os `FALSE_POS` e `GHOST` são seguros para ignorar
