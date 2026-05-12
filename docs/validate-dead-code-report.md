# Validate Dead Code — Documentação do Validador

## Por Que Este Validador Existe

O Memtrace é uma ferramenta excepcional para análise estrutural de código, mas o `find_dead_code` tem limitações conhecidas que produzem falsos positivos:

1. **Falsos positivos estruturais**: Memtrace não detecta dispatch dinâmico via Record (runtime lookup), funções passadas como valor (referência vs call edge), framework entry points (Next.js route handlers, Playwright globalSetup), MSW handlers, e mocks do Vitest. Estes padrões são impossíveis de detectar via análise estática de AST.

2. ~~**Bug de ghosts históricos**~~ ✅ **Resolvido na v0.3.90+**: O `find_dead_code` agora filtra por HEAD por padrão. Símbolos de commits antigos (ghosts) não aparecem mais. Passe `include_historical: true` para o comportamento antigo.

3. ~~**Path duplication no Windows**~~ ✅ **Resolvido na v0.3.90+**: O prefixo `\\?\` e a mistura de separadores são normalizados em 3 camadas (walker, scanner, query). O mesmo símbolo não aparece mais duplicado.

**Sem este validador**, o agente ou o desenvolvedor perde tempo investigando falsos positivos estruturais que ainda existem (item 1). Os itens 2 e 3 foram corrigidos upstream.

---

## Como Foi Implementado

### Arquitetura

O validador é um script Node.js (`scripts/validate-dead-code.mjs`) que funciona como um wrapper ao redor do `find_dead_code` do Memtrace:

```
Memtrace find_dead_code  →  JSON candidates  →  validate-dead-code.mjs  →  Tabela classificada
```

### Etapas do Script

1. **Recebe candidatos**: O script aceita input de duas formas:
   - Modo agente MCP: passando o output do `find_dead_code` como JSON
   - Modo CLI: `node scripts/validate-dead-code.mjs --file <caminho>.json`

2. **Deduplica**: Remove entradas duplicadas (safety net — o bug de path `\\?\` foi corrigido na v0.3.90, mas a dedup não custa nada).

3. **Classifica cada candidato** em 3 categorias:

   | Categoria | Label | Significado | Ação |
   |-----------|-------|-------------|------|
   | `GHOST` | 👻 | Símbolo não existe mais no código fonte. Residual — bug de ghosts históricos foi corrigido na v0.3.90. | Ignorar — safety net |
   | `FALSE_POS` | ⚠️ | Padrão conhecido de falso positivo estrutural (Record dispatch, função como valor, framework entry point, MSW, Vitest mock) | Ignorar — limitação conhecida |
   | `SUSPECT` | 🔍 | Símbolo existe no código fonte mas zero callers detectados. Provavelmente dead de verdade. | Revisar manualmente |

   > A categoria `CONFIRMED` foi removida — nunca foi usada na prática e o fluxo SUSPECT → revisão manual cobre o mesmo caso.

4. **Validação cruzada com grep**: Para cada candidato, o script executa `rg -l <symbol> src/` para verificar se o símbolo existe no código atual. Se não existir, classifica como `GHOST` (safety net).

5. **Validação contra catálogo de pitfalls**: Cada candidato é comparado com regex patterns do catálogo em `docs/memtrace-pitfalls.md`. Se houver match, classifica como `FALSE_POS` com a razão documentada.

### Dependências

- **Node.js** (>= 18, compatível com `import.meta.dirname`)
- **ripgrep** (`rg`) — para busca rápida em arquivos fonte
- Output do `find_dead_code` do Memtrace

---

## Como Implementar (Guia para Outros Usuários Windows)

Este guia explica como criar seu próprio validador de dead code se você usa Memtrace no Windows e enfrenta os mesmos falsos positivos.

### Pré-requisitos

- Node.js 18+ instalado
- Memtrace configurado e indexando seu repositório
- ripgrep (ou grep do Git Bash) disponível no PATH

### Passo 1: Crie o Script

```javascript
// scripts/validate-dead-code.mjs
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const PROJECT_ROOT = process.cwd();

// 1a: Defina seu catálogo de pitfalls
const PITFALLS = [
  // Dispatch dinâmico via Record/Map
  { pattern: /dispatchByType|executeRule/, name: 'Record dispatch',
    reason: 'Chamado via lookup em Record — runtime, não AST' },
  // Framework entry points
  { pattern: /^handler$/i, name: 'Next.js route handler',
    reason: 'Entry point do Next.js — invocado pelo runtime' },
  // MSW handlers
  { pattern: /^(GET|POST|PUT|DELETE) https?:\/\//i, name: 'MSW handler',
    reason: 'Handlers registrados no setup do MSW' },
  // Vitest mocks
  { pattern: /^(observe|unobserve|disconnect)$/i, name: 'Vitest mock',
    reason: 'Mock de IntersectionObserver' },
];

// 1b: Função de classificação
function classify(name) {
  for (const p of PITFALLS) {
    if (p.pattern.test(name)) return { verdict: 'FALSE_POS', reason: p.reason };
  }
  // Verificar existência no disco
  try {
    const result = execSync(`rg -l "${name}" src/`, { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim() ? { verdict: 'SUSPECT', reason: 'Existe no código mas zero callers' }
                         : { verdict: 'GHOST', reason: 'Não encontrado no código fonte' };
  } catch {
    return { verdict: 'GHOST', reason: 'Não encontrado no código fonte' };
  }
}

// 1c: Processar candidatos
function main(input) {
  const candidates = Array.isArray(input) ? input : [];
  for (const c of candidates) {
    const { verdict, reason } = classify(c.name);
    console.log(`${verdict.padEnd(12)} ${c.name.padEnd(40)} ${reason}`);
  }
}

const data = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
main(data);
```

### Passo 2: Adicione ao package.json (opcional)

```json
"validate:dead-code": "node scripts/validate-dead-code.mjs"
```

### Passo 3: Execute no seu fluxo

```powershell
# 1. Rode o find_dead_code via MCP e salve o output
# 2. Passe para o validador
node scripts/validate-dead-code.mjs --file .claude/dead-code-candidates.json
```

### Personalizando o Catálogo de Pitfalls

Para seu projeto, edite a lista `PITFALLS` no script incluindo:

- **Framework entry points**: Next.js (`handler` em route.ts), Nuxt, SvelteKit, Express middleware, etc.
- **MSW handlers**: Quaisquer handlers HTTP mockados via MSW
- **Injeção de dependência**: Se seu projeto usa DI containers (NestJS, Angular), funções registradas como providers
- **Reflection/Decorators**: Métodos invocados via decorator ou reflection

Para identificar novos padrões no seu projeto:

1. Liste candidatos do `find_dead_code`
2. Para cada candidato suspeito, faça grep no código procurando referências
3. Se o símbolo existe e é usado (via padrão runtime), adicione ao catálogo
4. Execute o validador novamente — agora ele classifica corretamente

### Evitando Remoção de Código Vivo

Sempre siga este fluxo antes de remover qualquer candidato:

1. **Execute o validador** → filtre apenas `SUSPECT`
2. **Para cada SUSPECT**, verifique manualmente:
   - O símbolo exporta algo? Pode ser usado por outro módulo não-indexado
   - É um template/layout/test fixture referenciado por framework?
   - É uma função de callback registrada em setup?
3. **Remova apenas se tiver 100% de certeza**

### Tratamento de Erros Comuns no Windows

| Erro | Causa | Solução |
|------|-------|---------|
| `rg` not found | ripgrep não está no PATH | Instale via `winget install BurntSushi.ripgrep.MSVC` |
| Path com `\\?\ ` inválido | Memtrace retorna paths com prefix | O script já trata na desduplicação por nome |
| Node.js não reconhece ESM | Versão antiga do Node | Use Node 18+ ou adicione `"type": "module"` no package.json |
| Encoding de caracteres especiais no stdout | Windows console | Use `sys.stdout.reconfigure(encoding="utf-8")` no Python |

---

## Referências

- Catálogo de pitfalls: `docs/memtrace-pitfalls.md`
- Script do validador: `scripts/validate-dead-code.mjs`
- Bug reportado upstream: `docs/memtrace-bug-reports-discord.md` (Bug #2 — find_dead_code retorna símbolos históricos)
- Sessão de design na retro: `epic-housekeeping-retro-2026-05-08.md` (Seção 4 - Memtrace)
