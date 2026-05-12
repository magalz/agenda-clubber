# Memtrace × BMad — Guia de Integração

**Como o grafo de código potencializa workflows de desenvolvimento assistido por IA.**

---

## 1. O Que É

[Memtrace](https://memtrace.ai) é um mecanismo de grafo de código estático que constrói um grafo completo do seu repositório: funções, classes, chamadas, imports, tipos, endpoints de API e suas relações estruturais. Ele expõe isso via um servidor MCP que agentes de IA (OpenCode, Claude Code, Cursor) consultam para entender, navegar e modificar código com segurança.

**BMad** é um ecossistema de workflows para desenvolvimento assistido por IA que orquestra agentes especializados (PM, Arquiteto, Dev, QA, Tech Writer, Code Reviewer) em ciclos produtivos.

A integração entre eles é **aditiva**: Memtrace adiciona uma camada de inteligência estrutural que os workflows BMad consultam — nenhum processo existente é substituído, apenas ampliado.

---

## 2. Setup Mínimo

```bash
# Instalação global
npm install -g memtrace@latest

# Âncora de workspace (raiz do projeto)
# Impede "0 nodes" por anchor mismatch entre MCP e CLI
touch .memtrace-workspace

# Indexação inicial
memtrace index .
# ou via MCP:
# mcp__memtrace__index_directory(path=".", clear_existing=true)
```

**Configuração MCP:** No seu `opencode.json` ou `claude_desktop_config.json`:

```json
{
  "mcp": {
    "memtrace": {
      "type": "local",
      "command": ["memtrace", "mcp"],
      "enabled": true,
      "environment": {}
    }
  }
}
```

---

## 3. Catálogo de Ferramentas MCP

Todas as ferramentas que o Memtrace expõe via MCP, organizadas por tipo de atividade.

### 3.1 Navegação e Descoberta de Código

| Ferramenta | O que faz | Substitui |
|-----------|-----------|-----------|
| `find_code(query)` | Busca híbrida (texto + semântica) por nome de símbolo, descrição natural ou padrão. Ex: `"autenticação token JWT"`, `"getUserById"` | `grep -r` + adivinhar onde está |
| `find_symbol(name)` | Busca exata ou fuzzy por nome de símbolo. Ex: `find_symbol(name="validateToken", fuzzy=true)` | `grep -r "validateToken"` |
| `get_source_window(file_path, start_line, end_line)` | Leitura de código com contexto controlado (antes/depois). Retorna somente o trecho relevante, com compressão opcional | `cat arquivo.ts` inteiro |
| `get_directory_tree(repo_id)` | Árvore de diretórios do repositório indexado, com suporte a zoom em subárvores | `tree` + adivinhar estrutura |

### 3.2 Mapeamento Arquitetural

| Ferramenta | O que faz | Substitui |
|-----------|-----------|-----------|
| `get_codebase_briefing(repo_id)` | Briefing estrutural: módulos, símbolos de alto risco, comunidades, endpoints, dead code candidates | Ler README + arquivos manualmente |
| `list_communities(repo_id)` | Comunidades Louvain — agrupamentos naturais de símbolos que se chamam muito. Revela bounded contexts não documentados | Análise manual de imports |
| `list_processes(repo_id)` | Fluxos de execução (cadeias de chamada) — entry points HTTP, CLI, jobs | Rastrear manualmente com grep |
| `get_process_flow(repo_id, process)` | Passo-a-passo de um fluxo de execução, do entry point até as folhas | `grep -r "fn("` em cascata |

### 3.3 Análise de Dependências e Relações

| Ferramenta | O que faz | Substitui |
|-----------|-----------|-----------|
| `get_symbol_context(repo_id, symbol)` | Visão 360°: callers, callees, tipo, comunidade, processo. Tudo em uma chamada | Múltiplos grep + grep reverso |
| `analyze_relationships(target, query_type)` | Callers, callees, hierarquia de classes, imports, exports, usos de tipo | `grep -r "Classe"` + `grep -r "extends Classe"` |
| `get_impact(repo_id, target)` | Raio de explosão: quem é afetado se este símbolo mudar, em N níveis de profundidade | Rastrear mentalmente quem importa o quê |
| `find_dependency_path(source, target, repo_id)` | Caminho mais curto entre dois símbolos. Útil para rastrear "como X chega em Y?" | Debug com breakpoints |
| `get_api_topology()` | Mapa completo de chamadas HTTP entre serviços (cross-repo) | Documentação de API desatualizada |

### 3.4 Análise de Qualidade

| Ferramenta | O que faz | Substitui |
|-----------|-----------|-----------|
| `find_dead_code(repo_id)` | Funções sem callers — candidatos a código morto | Inspeção manual de cada função |
| `find_most_complex_functions(repo_id)` | Top N funções por complexidade de grafo de chamadas | Adivinhar "o que é complexo" |
| `find_bridge_symbols(repo_id)` | Símbolos-ponte — pontos de acoplamento entre módulos aparentemente não relacionados | N/A — não detectável sem grafo |
| `find_central_symbols(repo_id)` | PageRank estrutural — símbolos mais "importantes" por número de dependentes | Intuição do dev |

### 3.5 Rastreamento Temporal

| Ferramenta | O que faz | Substitui |
|-----------|-----------|-----------|
| `get_evolution(repo_id, from, to)` | O que mudou entre duas datas — símbolos adicionados, modificados, removidos | `git log --oneline` + ler diffs |
| `get_changes_since(repo_id, since)` | O que mudou desde um ponto — âncora de sessão para continuidade entre sessões | `git diff` manual |
| `get_timeline(repo_id, symbol)` | Histórico completo de um símbolo através de todos os episódios (commits + working tree) | `git log -L` |
| `get_episode_replay(repo_id, episode)` | O que um commit específico tocou: nodes adicionados, modificados, removidos | `git show --stat` |

### 3.6 Gestão do Índice

| Ferramenta | O que faz |
|-----------|-----------|
| `index_directory(path, repo_id)` | Indexa (ou reindexa) um repositório no grafo |
| `list_indexed_repositories()` | Lista repositórios indexados com estatísticas |
| `watch_directory(path, repo_id)` | Observa mudanças em tempo real — `get_evolution` captura working-tree episodes |
| `delete_repository(repo_id)` | Remove um repositório do grafo |

---

## 4. Casos de Uso no Dia-a-Dia

Dos mais simples aos mais complexos, com exemplos de prompt para o agente.

### Nível 1: Substituindo grep e leitura de arquivos

**Antes:** `grep -r "funcaoX" src/` → abrir arquivo → procurar definição

**Com Memtrace:**
```
"Encontre a função claimArtistProfileAction e me mostre sua implementação"
→ find_symbol(name="claimArtistProfileAction")
→ get_source_window(file_path, start_line, end_line)

"Onde está definido o tipo EventWithRelations?"
→ find_code(query="EventWithRelations type definition")

"Me mostre a estrutura de diretórios do módulo de calendar"
→ get_directory_tree(repo_id="meu-projeto", max_depth=3)
```

### Nível 2: Entendendo o código antes de mexer

**Antes:** Ler arquivo → procurar imports → grep reverso → montar mapa mental

**Com Memtrace:**
```
"Quem chama a função updateEvent e o que ela chama?"
→ get_symbol_context(repo_id="meu-projeto", symbol="updateEvent")
   Retorna: 3 callers, 6 callees, comunidade "CalendarEvents"

"Qual o fluxo completo de uma requisição POST /api/events?"
→ get_process_flow(repo_id="meu-projeto", process="POST /api/events")
   Retorna: handler → validation → service → database → response

"Se eu mudar a interface EventSchema, o que quebra?"
→ get_impact(repo_id="meu-projeto", target="EventSchema")
   Retorna: 12 downstream symbols, RISK: HIGH

"Como a função authenticateRequest se conecta com o banco?"
→ find_dependency_path(source="authenticateRequest", target="supabaseClient", repo_id="meu-projeto")
```

### Nível 3: Qualidade e manutenção

**Antes:** N/A — não havia análise estrutural automatizada

**Com Memtrace:**
```
"Liste o código morto no projeto"
→ find_dead_code(repo_id="meu-projeto")
→ validar com script de pitfalls (se houver)

"Quais funções têm maior complexidade?"
→ find_most_complex_functions(repo_id="meu-projeto", top_n=20)
   Retorna: ranking com score e nível de risco

"O que mudou no código desde ontem?"
→ get_evolution(repo_id="meu-projeto", from="2026-05-10T00:00:00Z", mode="compound")
   Retorna: arquivos mais alterados + símbolos mais tocados

"Quais símbolos são os pontos de acoplamento críticos?"
→ find_bridge_symbols(repo_id="meu-projeto")
```

### Nível 4: Sessão e continuidade

**Antes:** Perder contexto entre sessões, reler código do zero

**Com Memtrace:**
```
"O que mudou desde minha última sessão?"
→ get_changes_since(repo_id="meu-projeto", since="2026-05-09T00:00:00Z")

"Mantenha o índice atualizado enquanto trabalho"
→ watch_directory(path=".", repo_id="meu-projeto")
```

---

## 5. Mapeamento com Workflows BMad

Cada workflow BMad pode se beneficiar do Memtrace em pontos específicos. Nenhum workflow *exige* Memtrace, mas todos ganham profundidade quando ele está disponível.

### 5.1 create-story

| Momento | O que o Memtrace oferece |
|---------|-------------------------|
| Entender a base de código atual | `get_codebase_briefing` + `get_directory_tree` |
| Identificar módulos afetados | `list_communities` + `find_central_symbols` |
| Mapear dependências da feature | `get_symbol_context` + `find_dependency_path` |

**Antes:** O arquiteto (Winston) lê arquivos manualmente para entender a estrutura.
**Depois:** O agente consulta o grafo e já chega com o mapa mental do código.

### 5.2 dev-story

| Momento | O que o Memtrace oferece |
|---------|-------------------------|
| Antes de refatorar | `get_impact(symbol)` — calcula raio de explosão |
| Durante implementação | `get_symbol_context` — entende relações |
| Após implementar | `get_evolution` — verifica regressões |
| Gate pré-PR | `find_dead_code` → `npm run qa:memtrace` (se configurado) |

**Antes:** Refatorava "no escuro", descobria o impacto nos testes.
**Depois:** Sabe o raio de explosão antes de mexer.

### 5.3 code-review (bmad-code-review)

| Camada de revisão | O que o Memtrace oferece |
|-------------------|-------------------------|
| Blind Hunter | `get_impact(symbols modificados)` — detecta cascatas inesperadas |
| Edge Case Hunter | `get_symbol_context` — entende todos os usos de um símbolo |
| Acceptance Auditor | `find_dead_code` — verifica se código morto foi deixado |

**Antes:** Revisor caçava referências com grep.
**Depois:** `get_impact` revela o alcance completo da mudança.

### 5.4 QA / bmad-tea

| Atividade | O que o Memtrace oferece |
|-----------|-------------------------|
| Design de testes | `find_most_complex_functions` — foco de teste onde a complexidade está |
| Análise de risco | `find_bridge_symbols` — testar primeiro os pontos de acoplamento |
| Cobertura estrutural | `get_process_flow` — mapeia fluxos que precisam de teste |

### 5.5 bmad-memtrace-feedback

Skill específico para registrar uso do Memtrace ao final de sessões:

1. Registra entry em `docs/memtrace-sessions-feedbacks.md`
2. Opcionalmente chama `record_external_episode` no grafo Memtrace
3. Gera métricas de quais ferramentas foram usadas

### 5.6 bmad-help

O catálogo `bmad-help.csv` pode listar skills relacionados ao Memtrace para que o sistema BMad os recomende automaticamente.

---

## 6. Infraestrutura Auxiliar Recomendada

### QA Gate (qa-memtrace.mjs)

Script que transforma o `find_dead_code` em um gate determinístico:

```
1. find_dead_code (MCP) → candidates.json
2. npm run qa:memtrace → report.md + exit code
3. Se exit 0 → pode prosseguir
4. Se exit 1 → SUSPECTs requerem revisão
```

O script:
- Deduplica candidatos
- Cruza com `grep` real (o símbolo existe no código hoje?)
- Compara com catálogo de falsos positivos estruturais (Record dispatch, função como valor, entry points de framework)
- Gera report markdown com classificação (SUSPECT / FALSE_POS / GHOST)

### Catálogo de Pitfalls (memtrace-pitfalls.md)

Documenta padrões que o Memtrace não detecta por análise estática:

| Padrão | Exemplo | Por que falha |
|--------|---------|--------------|
| Dispatch via Record | `BUILDERS[h.rule](h)` | Runtime lookup |
| Função como valor | `useState(CopyIcon)` | Referência, não call edge |
| Entry points de framework | `handler` em route.ts | Invocado pelo runtime |
| MSW handlers | `setupServer(...)` | Registrados, não chamados |
| Mocks de teste | `vitest.setup.ts` | Setup-only |

### Workspace Anchor (.memtrace-workspace)

Arquivo vazio na raiz do projeto que garante que `memtrace mcp` e `memtrace start` convergem no mesmo `.memdb`.

---

## 7. Boas Práticas

1. **Comece pequeno.** Indexe o repositório e use `find_code` / `get_symbol_context` para navegar. A complexidade vem depois.

2. **Use `get_impact` antes de refatorar.** É a ferramenta de maior retorno: evita surpresas com 1 chamada MCP.

3. **Dead code validation com gate.** `find_dead_code` + `qa-memtrace.mjs` + pitfalls catalog = pipeline confiável. Sem o gate, o agente pode ignorar.

4. **Preferência por gráfico sobre texto.** `get_symbol_context` entrega em 1 chamada o que exigiria 5-10 grep + leituras de arquivo.

5. **Mantenha o índice fresco.** Use `watch_directory` para que o grafo reflita mudanças não-commitadas. Use `index_directory` com `clear_existing=true` após upgrades do Memtrace.

6. **Documente falsos positivos.** O pitfalls catalog é um living document — toda vez que um SUSPECT se revela falso positivo, documente o padrão.

7. **Registre feedback.** O `bmad-memtrace-feedback` gera rastro de uso que ajuda a decidir onde aprofundar a integração.

---

## 8. Referências

- [Memtrace Docs](https://docs.memtrace.dev)
- [Memtrace GitHub](https://github.com/syncable-dev/memtrace-public)
- BMad: skills `bmad-memtrace-feedback`, `bmad-dev-story`, `bmad-code-review`
