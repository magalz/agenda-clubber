# Memtrace × BMAD — Guia de Integração por Fase do Ciclo de Desenvolvimento

> **Para quem?** Devs usando BMAD (BMad Method) + Memtrace no mesmo projeto.
> **Objetivo:** Saber qual ferramenta do Memtrace usar em cada etapa do ciclo BMAD, com qual agente falar, e como fazer o setup guiado.

---

## ⚡ Antes de Começar — Recomendações de Modelo

Este guia tem dois perfis de uso bem diferentes. Use o modelo certo pra cada um:

| Momento | Modelo | Por quê |
|---------|--------|---------|
| **Setup guiado** (Seção 3 — instalação interativa) | 🧠 **Modelo PARRUDO + max thinking** (Pro, Opus, Sonnet com reasoning ativo) | Você vai tomar ~15 decisões de integração que afetam TODOS os seus workflows. A IA precisa reter contexto longo, navegar entre ferramentas Memtrace e BMAD, entender tradeoffs, e gerar 9 arquivos `.toml` estruturados. Flash/Haiku pode perder o fio da meada e esquecer respostas do meio do fluxo. |
| **Uso diário** (`/bmad-code-review`, `/bmad-agent-dev`, etc.) | ⚡ **Modelo LEVE** (Flash, Haiku, Sonnet normal) | As decisões já estão nos `.toml`. O agente só precisa seguir o roteiro — executar `get_impact`, `find_code`, `get_evolution` como instruído pelos `activation_steps_prepend`. As ferramentas são chamadas individuais, não precisa de raciocínio profundo. |

> 💡 **Regra prática:** Se for INSTALAR (setup), use cérebro grande. Se for USAR (dia a dia), o leve resolve.

**Requisitos técnicos:**
- BMAD instalado no projeto (com `_bmad/` na raiz)
- Memtrace MCP server rodando com o repositório indexado (`memtrace index`)
- AI cliente com suporte a MCP tools (Claude Code, OpenCode, Cursor, etc.)
- Nenhuma dependência específica de ferramenta — o sistema é agnóstico a AI client

---

## Índice

1. [Caso Real: Impacto do Memtrace num Projeto BMAD](#-caso-real-impacto-do-memtrace-num-projeto-bmad)
2. [Resumo: o que cada tool do Memtrace resolve](#1-resumo-memtrace-tools)
3. [Integração por Workflow BMAD (com agente e prompt)](#2-integração-por-workflow-bmad)
4. [Prompts Completos por Workflow](#210-prompts-completos-por-workflow)
5. [Setup Guiado por IA — Instalação Interativa](#3-setup-guiado-por-ia)

---

## 📊 Caso Real: Impacto do Memtrace num Projeto BMAD

> **Contexto:** Projeto web com ~280 símbolos indexados, 5 módulos lógicos, stack Next.js + PostgreSQL. Um épico de 5 stories entregou o núcleo de inteligência do produto (motor de regras, calendário reativo, privacidade granular). Período: 7 dias.

### Antes × Depois: O que o Memtrace mudou na Retrospectiva

| Ferramenta Memtrace | Resultado concreto | Sem o Memtrace | Tempo aproximado economizado |
|---------------------|-------------------|----------------|------------------------------|
| `get_codebase_briefing` | Escopo quantificado em 5s: 485 novos símbolos, 2.273 edges, 5 módulos | Ler package.json, `tree` do projeto, abrir 5-10 arquivos manualmente, inferir arquitetura | ~20 min → 5s |
| `get_evolution(compound)` | 142 episódios de mudança, top 10 arquivos mais modificados, 485 símbolos criados | `git log --oneline`, `git diff --stat`, contar manualmente, perder mudanças em branches | ~30 min → 5s |
| `find_most_complex_functions` | 2 funções de alto risco identificadas (complexidade 28 e 17) viraram stories de refactoring | Revisão manual de código procurando funções longas — subjetivo, provavelmente não identificaria | ~1-2h → 5s (e mais preciso) |
| `find_dead_code` | 80 símbolos sem callers → story de housekeeping com escopo preciso | Nunca seria feito numa retrospectiva. Ficaria como "devíamos limpar o código" — vago, sem ação | Infinito → 5s (tornou possível) |
| `find_central_symbols` | Tipo mais conectado (62 referências) confirmou que foco da análise estava correto | Impossível sem análise de grafo. "Achismo" baseado em familiaridade com o código | Inviável → 5s |
| `get_symbol_context` | Função principal do motor: 7 callees, comunidade detectada, fluxo mapeado | Ler 7 arquivos, rastrear imports, entender dependências manualmente | ~20 min → 5s |

### Ganhos por Fase do Ciclo

| Fase BMAD | Sem Memtrace | Com Memtrace |
|-----------|-------------|--------------|
| **Planejamento** | Épicos baseados em intuição sobre a arquitetura | Épicos validados contra os módulos reais detectados pelo grafo |
| **Implementação** | Editar função sem saber blast radius — descobrir na PR que quebrou 6 arquivos | `get_impact` pré-edição: risco HIGH/CRITICAL sinalizado antes de escrever código |
| **Code Review** | Revisar diff sem contexto do que está fora dele | `get_impact` revela arquivos afetados indiretamente; `find_dependency_path` acha edge cases |
| **Testes** | "Parece que os testes cobrem tudo" | `list_processes` → cross-reference com E2E → "3 fluxos de usuário sem cobertura" |
| **Retrospectiva** | Discussão qualitativa: "esse componente tá grande" | Discussão quantitativa: "complexidade 17, 230 linhas, 80 dead symbols — aqui estão 7 stories de housekeeping" |

### Antes × Depois: Estrutura de Ação

| Aspecto | Antes (sem Memtrace) | Depois (com Memtrace) |
|---------|---------------------|----------------------|
| **Tech debt** | 1 entrada vaga no `deferred-work.md` | 25 itens catalogados por severidade, origem e owner |
| **Refactoring** | "Devíamos refatorar o componente X" | Story H1: `updateEvent` (complexidade 28 → meta < 15) com escopo e arquivos precisos |
| **Housekeeping** | "Tem código morto em algum lugar" | Story H3: 80 símbolos para remover, lista exata de arquivos |
| **Decisões de produto** | Discussão adiada "para depois" | 5 decisões pendentes catalogadas como `decision-pending` com origem rastreável |
| **CI/CD** | Pipeline monolítico, feedback lento | Jobs paralelizáveis, gates de complexidade e dead code, seed determinístico |

### O Que Era Impossível Antes

| Insight | Ferramenta |
|---------|-----------|
| Saber que uma interface tem 62 referências e é o símbolo mais central do sistema | `find_central_symbols` |
| Descobrir que o motor de regras pertence a uma comunidade lógica (`EventEvaluateDate`) | `get_symbol_context` / `list_communities` |
| Quantificar precisamente o escopo de um épico em símbolos e edges | `get_evolution(compound)` |
| Identificar funções sem callers sem grep manual exaustivo | `find_dead_code` |

> 💡 **Conclusão:** O Memtrace não substituiu a análise qualitativa — ele deu **dentes quantitativos** a ela. Onde antes havia "esse módulo parece grande", agora há "complexidade cognitiva 28, 95 linhas, 6 callees". Isso transformou discussões subjetivas em action items mensuráveis.

---

## 1. Resumo: Memtrace Tools

| Tool | O que faz | Melhor momento |
|------|-----------|----------------|
| `get_codebase_briefing` | Visão geral: escala, módulos, riscos, dead code | Início de qualquer sessão |
| `find_code` | Busca semântica no código ("retry logic", "auth token") | Explorar código sem saber nome exato |
| `find_symbol` | Busca por nome exato de símbolo | Quando sabe o que procurar |
| `get_symbol_context` | Callers + callees + comunidade + processo de um símbolo | Antes de editar qualquer função |
| `get_impact` | Blast radius: quem seria afetado se eu mudar X? | Antes de refatorar, antes de merge |
| `find_most_complex_functions` | Top-N funções mais complexas | Priorizar refactoring, gate de PR |
| `find_dead_code` | Funções/métodos sem callers | Limpeza, gate de PR |
| `find_central_symbols` | Símbolos com maior PageRank (mais conectados) | Identificar código "load-bearing" |
| `find_bridge_symbols` | Chokepoints arquiteturais entre subsistemas | Refactoring de alto risco |
| `find_dependency_path` | Caminho mais curto entre símbolo A e B | Debugging, análise de dependência |
| `get_evolution` | O que mudou no código entre duas datas/commits | Retrospectiva, pre-PR check |
| `get_changes_since` | O que mudou desde minha última sessão | Continuidade entre sessões |
| `get_process_flow` | Passo a passo de um fluxo de execução | Design de testes, debugging |
| `list_processes` | Todos os fluxos de execução detectados | Mapeamento de cobertura de testes |
| `list_communities` | Módulos lógicos detectados por Louvain | Análise de arquitetura |
| `get_api_topology` | Quem chama qual endpoint (cross-service) | Análise de dependência entre serviços |
| `get_cochange_context` | Quais arquivos mudam juntos historicamente? | Acoplamento oculto |
| `get_timeline` | Histórico completo de um símbolo ao longo do tempo | Debugging, "quando isso quebrou?" |

---

## 2. Integração por Workflow BMAD

Cada seção indica: o workflow BMAD, o agente-alvo (com comando para invocar), a ferramenta Memtrace, o prompt curto, e o ganho.

### 2.1 Planning (PRD → Epics → Stories)

| Workflow BMAD | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------------|-------------------|---------------|--------------|---------|
| `bmad-create-epics-and-stories` | John — PM (`/bmad-agent-pm`) | `get_codebase_briefing` | "Antes de criar os épicos, execute `get_codebase_briefing` e confirme que os épicos mapeiam os módulos reais do código." | Confirma que os épicos mapeiam os módulos reais |
| `bmad-create-story` | John (`/bmad-agent-pm`) ou Amelia (`/bmad-agent-dev`) | `get_symbol_context` | "Para cada dependência listada no épico, rode `get_symbol_context` e popule a seção 'Previous Story Intelligence' com callers/callees reais." | Popula dependências com dados reais do grafo |
| `bmad-check-implementation-readiness` | Winston — Architect (`/bmad-agent-architect`) | `get_impact` | "Rode `get_impact` no target de cada story. Se HIGH/CRITICAL, marque como bloqueador." | Detecta se a story toca código de alto risco |

### 2.2 Implementation (dev-story)

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Início da story | Amelia — Dev (`/bmad-agent-dev`) | `find_code` | "Use `find_code` com linguagem natural para localizar código existente relacionado a esta feature antes de começar a implementar." | Encontra padrões mais rápido que glob/grep |
| Antes de editar qualquer arquivo | Amelia (`/bmad-agent-dev`) | `get_impact` | "Antes de editar esta função, execute `get_impact(direction='both')`. Se risco HIGH/CRITICAL, me avise e sugira abordagem mais segura." | **Safety gate** pré-edição |
| Durante implementação | Amelia (`/bmad-agent-dev`) | `find_code` | "Use `find_code` para buscar padrões existentes de como lidamos com [Zod/RLS/geocoding] antes de implementar do zero." | Reuso de padrões |
| Após implementar | Amelia (`/bmad-agent-dev`) | `get_evolution` | "Após implementar, execute `get_evolution(from='<timestamp>', mode='compound')` para verificar mudanças não planejadas." | Detecta regressões |
| Para APIs | Amelia (`/bmad-agent-dev`) | `find_api_endpoints` + `find_api_calls` | "Execute `find_api_endpoints` e `find_api_calls` para ver quem chama este endpoint antes de alterar a assinatura." | Evita quebrar consumers |

### 2.3 Code Review

| Camada | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|--------|-------------------|---------------|--------------|---------|
| Blind Hunter | Amelia — Dev (`/bmad-code-review`) | `get_impact` | "Para cada função modificada, execute `get_impact` e liste os downstream files que não estão no diff — revise-os também." | Arquivos afetados fora do diff |
| Edge Case Hunter | Amelia (`/bmad-code-review`) | `find_dependency_path` | "Rode `find_dependency_path` entre módulos não relacionados ao diff. Caminhos encontrados = edge cases." | Caminhos surpresa = casos de borda |
| Acceptance Auditor | Amelia (`/bmad-code-review`) | `get_process_flow` | "Execute `get_process_flow` do fluxo alterado. Cada step = um AC. Verifique se todos estão cobertos por testes." | Cada step do processo = um AC |
| Gate automático (CI) | N/A (pipeline) | `find_dead_code` + `find_most_complex_functions` | "Adicione ao CI: step que compara `find_dead_code` e `find_most_complex_functions` do branch vs main. Falhe se introduzir regressão." | Qualidade automatizada |

### 2.4 Testing

| Atividade | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|-----------|-------------------|---------------|--------------|---------|
| Análise de cobertura | Murat — QA (`/bmad-tea`) | `list_processes` | "Execute `list_processes` e faça cross-reference com os specs em `e2e/`. Liste os fluxos de usuário sem cobertura E2E." | Quais fluxos não têm E2E? |
| Design de teste | Murat (`/bmad-tea`) | `get_process_flow` | "Para o processo [Nome], execute `get_process_flow`. Cada step do fluxo deve gerar pelo menos um caso de teste." | Cada step = um caso de teste |
| Gap analysis | Murat (`/bmad-tea`) | `find_symbol` | "Liste funções exportadas nos arquivos modificados com `find_symbol`. Verifique se cada uma tem cobertura de teste." | Funções exportadas sem testes = gap |
| Edge case discovery | Murat (`/bmad-tea`) | `get_impact` | "Execute `get_impact(direction='upstream')` nas funções de entrada. Callers com inputs inesperados = novos casos de borda." | Inputs inesperados dos callers |

### 2.5 Retrospective

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Overview do épico | Amelia — Dev (`/bmad-retrospective`) | `get_evolution` | "Execute `get_evolution(mode='compound')` do início ao fim do épico para quantificar o escopo." | Escopo quantificado |
| O que refatorar | Amelia (`/bmad-retrospective`) | `find_most_complex_functions` | "Rode `find_most_complex_functions(top_n=15)` e sugira stories de refactoring para os de maior risco." | Lista objetiva de pontos de dor |
| O que limpar | Amelia (`/bmad-retrospective`) | `find_dead_code` | "Execute `find_dead_code(limit=30)`. Converta os candidatos em uma story de housekeeping." | Escopo de limpeza quantificado |
| O que é crítico | Amelia (`/bmad-retrospective`) | `find_central_symbols` | "Rode `find_central_symbols(limit=15)`. Marque como load-bearing — cuidado extra ao refatorar." | Código estruturalmente crítico |

### 2.6 Sprint Planning

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Priorização | Amelia — Dev (`/bmad-sprint-planning`) | `find_most_complex_functions` | "Execute `find_most_complex_functions` e priorize stories que tocam funções de alta complexidade." | Funções complexas = maior risco |
| Estimativa | Amelia (`/bmad-sprint-planning`) | `get_impact` | "Rode `get_impact` nos targets de cada story. Blast radius grande = mais esforço." | Blast radius como proxy de esforço |
| Ordenação | Amelia (`/bmad-sprint-planning`) | `get_codebase_briefing` | "Execute `get_codebase_briefing` e valide se a ordem das stories faz sentido arquiteturalmente." | Ordem validada pela arquitetura real |

### 2.7 Course Correction

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Entender impacto | Amelia — Dev (`/bmad-correct-course`) | `get_evolution` | "Execute `get_evolution` desde o início da sprint para entender o que já foi construído." | Baseline do progresso |
| Risco da mudança | Amelia (`/bmad-correct-course`) | `get_impact` | "Rode `get_impact` nos novos targets. Se a mudança quebrar código existente, sugira mitigação." | Avaliação de risco |
| Rollback | Amelia (`/bmad-correct-course`) | `get_timeline` | "Execute `get_timeline` dos símbolos afetados para ter o histórico completo caso precise reverter." | Histórico para rollback |

### 2.8 Debugging / Incident

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Encontrar causa | Amelia — Dev (`/bmad-quick-dev`) | `find_code` | "Use `find_code` com a mensagem de erro '...' para localizar onde o erro é gerado no código." | Localiza origem do erro |
| Quando quebrou | Amelia (`/bmad-quick-dev`) | `get_timeline` | "Execute `get_timeline` no símbolo [nome] para ver todas as mudanças e identificar quando o bug foi introduzido." | Histórico completo do símbolo |
| Blast radius | Amelia (`/bmad-quick-dev`) | `get_impact` | "Rode `get_impact(symbol, direction='downstream')` no símbolo quebrado para ver o que mais foi afetado." | O que mais quebrou |
| Acoplamento oculto | Amelia (`/bmad-quick-dev`) | `get_cochange_context` | "Execute `get_cochange_context` no arquivo quebrado. Arquivos que sempre mudam juntos podem estar relacionados." | Dependências ocultas |

### 2.9 Session Continuity

| Momento | Agente (comando) | Memtrace Tool | Prompt curto | Por quê |
|---------|-------------------|---------------|--------------|---------|
| Primeira sessão | Qualquer agente BMAD | `get_codebase_briefing` | "Execute `get_codebase_briefing(detail_level='full')` para entender a arquitetura antes de começar." | Arquitetura em 30s |
| Retomar sessão | Qualquer agente BMAD | `get_changes_since` | "Rode `get_changes_since` no repo para ver o que mudou desde a última sessão." | Contexto rápido |
| Entender branch | Qualquer agente BMAD | `get_codebase_briefing` | "Execute `get_codebase_briefing` no branch atual para entender o que foi construído nele." | Escopo do branch |

---

### 2.10 Prompts Completos por Workflow

> **Copie e cole** o prompt abaixo no agente indicado. Cada prompt já inclui todas as ferramentas Memtrace recomendadas para aquele workflow, na ordem correta, com gatilhos de segurança.

---

#### 📋 Planejamento de Épicos e Stories

**Agente:** John — PM (`/bmad-agent-pm`)

```
Antes de criar os épicos e stories, execute estas verificações com Memtrace:

1. get_codebase_briefing(detail_level="full") — entenda a arquitetura atual
2. find_most_complex_functions(top_n=10) — identifique código de alto risco
3. list_communities — confirme que os módulos detectados batem com os épicos propostos

Depois, para cada story criada:
4. get_symbol_context nas dependências listadas — popule "Previous Story Intelligence" com callers/callees reais do grafo
5. get_impact no target principal — se HIGH/CRITICAL, marque como risco no story file

Se houver dúvida sobre ordem das stories:
6. find_dependency_path entre os targets de stories consecutivas para validar precedência
```

---

#### 🛠️ Implementação de Story

**Agente:** Amelia — Dev (`/bmad-agent-dev`)

```
Você vai implementar esta story. Siga este protocolo com Memtrace:

ANTES de editar qualquer arquivo:
1. find_code com linguagem natural sobre a feature — localize código existente relacionado
2. get_impact no target principal (direction="both") — se HIGH/CRITICAL, me avise antes de prosseguir
3. get_symbol_context em cada dependência listada — entenda callers/callees reais

DURANTE a implementação:
4. find_code para buscar padrões existentes ("como lidamos com Zod validation?", "existe helper de RLS?")
5. find_api_endpoints + find_api_calls — antes de alterar assinatura de Server Action, veja quem chama
6. find_bridge_symbols — se o target for bridge symbol, refatore com cuidado extra

APÓS implementar:
7. get_evolution(from="<timestamp antes de começar>", mode="compound") — verifique mudanças não planejadas
8. find_dead_code — confirme que não introduziu símbolos sem callers
```

---

#### 🔍 Code Review (3 camadas)

**Agente:** Amelia — Dev (`/bmad-code-review`)

```
Execute o review adversarial em 3 camadas com suporte do Memtrace:

CAMADA 1 — BLIND HUNTER:
1. get_evolution no branch (mode="compound") — baseline do que foi tocado
2. get_impact em CADA função modificada — liste downstream files que NÃO estão no diff (devem ser revisados também)
3. find_bridge_symbols no diff — refactors em bridges = alto risco, escrutínio redobrado
4. find_central_symbols nos arquivos modificados — se tocou símbolo load-bearing, verifique com atenção

CAMADA 2 — EDGE CASE HUNTER:
5. find_dependency_path entre módulos não relacionados ao diff — caminhos encontrados = edge cases
6. get_impact(direction="upstream") nas funções de entrada — callers com inputs inesperados?

CAMADA 3 — ACCEPTANCE AUDITOR:
7. get_process_flow do fluxo alterado — cada step = um AC, verifique cobertura de testes
8. find_dead_code — o PR introduziu novos símbolos sem callers?
9. find_most_complex_functions — comparar branch vs main, falhe se introduziu função com complexity > 15
```

---

#### 🧪 QA e Testes

**Agente:** Murat — QA (`/bmad-tea`)

```
Analise a qualidade de testes do projeto usando Memtrace:

1. list_processes — mapeie todos os fluxos de execução detectados
2. Cross-reference com e2e/*.spec.ts — liste fluxos SEM cobertura E2E
3. Para cada fluxo sem cobertura: get_process_flow("[nome]") — cada step = um caso de teste a gerar
4. find_symbol nos arquivos modificados — liste funções exportadas, verifique se cada uma tem teste
5. get_impact(direction="upstream") nas funções de entrada — callers com inputs inesperados = novos edge cases
6. find_dead_code — verifique se testes referenciam funções que não existem mais
```

---

#### 🔄 Retrospectiva de Épico

**Agente:** Amelia — Dev (`/bmad-retrospective`)

```
Execute a retrospectiva com análise quantitativa do Memtrace:

1. get_evolution(mode="compound", from="<data início do épico>") — escopo quantificado: símbolos, edges, episódios
2. find_most_complex_functions(top_n=15) — priorize refactoring pelos de maior risco
3. find_dead_code(limit=30) — converta candidatos em story de housekeeping
4. find_central_symbols(limit=15) — marque load-bearing, cuidado extra ao refatorar
5. list_communities — compare estrutura antes/depois do épico, detecte god-modules
6. get_codebase_briefing — compare métricas (nodes, edges) com briefing pré-épico se disponível
```

---

#### 📊 Sprint Planning

**Agente:** Amelia — Dev (`/bmad-sprint-planning`)

```
Planeje a sprint com dados do Memtrace:

1. get_codebase_briefing — overview da arquitetura atual
2. find_most_complex_functions(top_n=15) — stories que tocam funções complexas = prioridade
3. get_impact nos targets de cada story candidata — blast radius grande = mais esforço, ajuste estimativas
4. list_processes — entenda o escopo funcional completo ao priorizar
5. find_dependency_path entre stories consecutivas — valide que a ordem não tem dependência cíclica
```

---

#### 🚨 Course Correction (mudança mid-sprint)

**Agente:** Amelia — Dev (`/bmad-correct-course`)

```
Avalie o impacto da mudança proposta com Memtrace:

1. get_evolution(from="<início da sprint>", mode="compound") — o que já foi construído?
2. get_impact nos novos targets — a mudança quebra código existente? Se sim, sugira mitigação
3. get_timeline nos símbolos afetados — histórico completo para rollback se necessário
4. find_dependency_path entre a mudança e código crítico — caminhos indiretos de impacto
5. get_cochange_context nos arquivos afetados — quais arquivos sempre mudam juntos? Eles também precisam de ajuste?
```

---

#### 🐛 Debugging / Investigação de Incidente

**Agente:** Amelia — Dev (`/bmad-quick-dev`)

```
Investigue o problema com Memtrace:

1. find_code com a mensagem de erro "..." — localize onde o erro é gerado
2. get_timeline no símbolo com erro — quando foi a última mudança? O que mudou?
3. get_impact(symbol, direction="downstream") — o que mais quebrou?
4. get_process_flow do fluxo afetado — trace o caminho completo, encontre o step que falha
5. get_cochange_context no arquivo quebrado — arquivos que mudam juntos podem estar relacionados
6. get_evolution(from="<última versão estável>") — o que mudou desde que funcionava?
```

---

#### 🔗 Início ou Retomada de Sessão

**Agente:** Qualquer (`/bmad-help` ou agente-alvo)

```
Prepare o contexto da sessão com Memtrace:

1. get_codebase_briefing(detail_level="full") — entenda a arquitetura em 30 segundos
2. get_changes_since — o que mudou desde a última sessão? (se for retomada)
3. list_communities — visão dos módulos lógicos
4. find_central_symbols(limit=10) — saiba quais símbolos são load-bearing antes de mexer
```

---

## 3. Setup Guiado por IA

> **⚠️ INSTRUÇÕES PARA HUMANOS:** Esta seção é um script para a IA executar.
> Abra o BMAD no seu projeto, cole o link deste guia, e diga: **"Execute o setup guiado da seção 3."**
> A IA vai perguntar ferramenta por ferramenta se você quer instalar.

---

### 🤖 LLM INSTRUCTION BLOCK — START

> **YOU (the LLM) are executing an interactive guided setup.** Your goal: walk the user through each Memtrace tool and ask if they want to integrate it into the corresponding BMAD workflow. At the end, update the BMAD agent/workflow files to incorporate all accepted tools.

**Setup Protocol:**

1. Greet the user in their language. Explain: "I'll walk you through each Memtrace tool. For each one, I'll explain what it does, where it fits in the BMAD workflow, which agent to talk to (with the command to invoke them), and a short prompt to ask them. You answer **S** (Sim/Yes) or **N** (Não/No). At the end, I'll update your BMAD configs automatically."

2. For each of the 15 tools below, present the tool description, then ask for confirmation. Track all "S" answers.

3. After going through all tools, proceed to **Phase 2: Apply** below.

---

#### Ferramenta 1: `get_codebase_briefing`

**Função:** Visão geral do código — escala, módulos, riscos, dead code.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-create-epics-and-stories` | John — PM (`/bmad-agent-pm`) | "Antes de criar os épicos, execute `get_codebase_briefing` e confirme que os épicos mapeiam os módulos reais do código." |
| `bmad-sprint-planning` | Amelia — Dev (`/bmad-sprint-planning`) | "Execute `get_codebase_briefing` e valide se a ordem das stories faz sentido arquiteturalmente." |
| Session start (qualquer) | Todos os agentes | "Execute `get_codebase_briefing(detail_level='full')` para entender a arquitetura antes de começar." |

**Pergunta:** Instalar `get_codebase_briefing` nos workflows acima? (S/N)

---

#### Ferramenta 2: `find_code`

**Função:** Busca semântica no código ("retry logic", "auth token pooling").

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-dev-story` | Amelia — Dev (`/bmad-agent-dev`) | "Use `find_code` com linguagem natural para localizar código existente relacionado a esta feature antes de começar." |
| Debugging | Amelia — Dev (`/bmad-quick-dev`) | "Use `find_code` com a mensagem de erro para localizar onde o erro é gerado." |

**Pergunta:** Instalar `find_code` como ferramenta de busca primária no dev-story e debugging? (S/N)

---

#### Ferramenta 3: `find_symbol`

**Função:** Busca por nome exato de símbolo (função, classe, tipo).

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-dev-story` | Amelia — Dev (`/bmad-agent-dev`) | "Use `find_symbol` para localizar a implementação exata da função/tipo referenciada." |
| QA | Murat — QA (`/bmad-tea`) | "Liste funções exportadas com `find_symbol`. Verifique se cada uma tem teste correspondente." |

**Pergunta:** Instalar `find_symbol` no dev-story e QA? (S/N)

---

#### Ferramenta 4: `get_symbol_context`

**Função:** Callers, callees, comunidade e processo de um símbolo — visão 360°.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-create-story` | John — PM (`/bmad-agent-pm`) | "Para cada dependência listada no épico, rode `get_symbol_context` e popule 'Previous Story Intelligence' com callers/callees reais." |
| `bmad-dev-story` | Amelia — Dev (`/bmad-agent-dev`) | "Antes de editar esta função, execute `get_symbol_context` para entender o contexto completo." |

**Pergunta:** Instalar `get_symbol_context` no create-story e dev-story? (S/N)

---

#### Ferramenta 5: `get_impact`

**Função:** Blast radius — quantos símbolos seriam afetados se X mudar, com nível de risco.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-dev-story` (pré-edição) | Amelia — Dev (`/bmad-agent-dev`) | "Antes de editar esta função, execute `get_impact(direction='both')`. Se HIGH/CRITICAL, me avise." |
| `bmad-code-review` | Amelia — Dev (`/bmad-code-review`) | "Para cada função modificada, execute `get_impact`. Liste downstream files não no diff." |
| `bmad-check-implementation-readiness` | Winston — Architect (`/bmad-agent-architect`) | "Rode `get_impact` no target de cada story. HIGH/CRITICAL → bloqueador." |
| `bmad-sprint-planning` | Amelia — Dev (`/bmad-sprint-planning`) | "Rode `get_impact` nos targets. Blast radius grande = mais esforço." |
| `bmad-correct-course` | Amelia — Dev (`/bmad-correct-course`) | "Rode `get_impact` nos novos targets para avaliar risco da mudança." |

**Pergunta:** Instalar `get_impact` como safety gate pré-edição + code review + readiness? (S/N)

---

#### Ferramenta 6: `find_most_complex_functions`

**Função:** Top-N funções mais complexas (por complexidade cognitiva e out-degree).

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-retrospective` | Amelia — Dev (`/bmad-retrospective`) | "Rode `find_most_complex_functions(top_n=15)` e sugira stories de refactoring para os de maior risco." |
| `bmad-sprint-planning` | Amelia — Dev (`/bmad-sprint-planning`) | "Execute `find_most_complex_functions` e priorize stories que tocam funções de alta complexidade." |
| CI/CD gate | Pipeline (`.github/workflows/ci.yml`) | "Adicione step que compara `find_most_complex_functions` do branch vs main. Falhe se introduzir função > threshold." |

**Pergunta:** Instalar `find_most_complex_functions` na retrospectiva, sprint-planning e CI? (S/N)

---

#### Ferramenta 7: `find_dead_code`

**Função:** Funções/métodos sem callers — candidatos a remoção.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-retrospective` | Amelia — Dev (`/bmad-retrospective`) | "Execute `find_dead_code(limit=30)`. Converta os candidatos em uma story de housekeeping." |
| `bmad-code-review` | Amelia — Dev (`/bmad-code-review`) | "Rode `find_dead_code` no branch. Flag se o PR introduziu novos símbolos sem callers." |
| CI/CD gate | Pipeline (`.github/workflows/ci.yml`) | "Adicione step que compara `find_dead_code` do branch vs main. Alerte se aumentar." |

**Pergunta:** Instalar `find_dead_code` na retrospectiva, code review e CI? (S/N)

---

#### Ferramenta 8: `find_central_symbols`

**Função:** Símbolos com maior PageRank — código "load-bearing".

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-retrospective` | Amelia — Dev (`/bmad-retrospective`) | "Rode `find_central_symbols(limit=15)`. Marque como load-bearing." |
| `bmad-dev-story` | Amelia — Dev (`/bmad-agent-dev`) | "Execute `find_central_symbols` nos arquivos que vai editar. Alerta se for símbolo de alta centralidade." |

**Pergunta:** Instalar `find_central_symbols` na retrospectiva e dev-story? (S/N)

---

#### Ferramenta 9: `find_bridge_symbols`

**Função:** Chokepoints arquiteturais — símbolos que conectam subsistemas desconectados.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-dev-story` (pré-refactor) | Amelia — Dev (`/bmad-agent-dev`) | "Antes de refatorar, execute `find_bridge_symbols`. Se o target for bridge, alerte — alto risco." |
| `bmad-code-review` | Amelia — Dev (`/bmad-code-review`) | "Rode `find_bridge_symbols` no diff. Refactors em bridges = atenção redobrada." |

**Pergunta:** Instalar `find_bridge_symbols` como alerta pré-refactor? (S/N)

---

#### Ferramenta 10: `get_evolution`

**Função:** O que mudou no código entre duas datas/commits — arquivos e símbolos.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-retrospective` | Amelia — Dev (`/bmad-retrospective`) | "Execute `get_evolution(mode='compound')` do início ao fim do épico para quantificar o escopo." |
| `bmad-dev-story` (pós-impl.) | Amelia — Dev (`/bmad-agent-dev`) | "Após implementar, execute `get_evolution(from='<timestamp>', mode='compound')` para detectar mudanças não planejadas." |
| `bmad-correct-course` | Amelia — Dev (`/bmad-correct-course`) | "Execute `get_evolution` desde o início da sprint para entender o progresso." |
| `bmad-code-review` | Amelia — Dev (`/bmad-code-review`) | "Rode `get_evolution` no branch para ver baseline do que foi tocado." |

**Pergunta:** Instalar `get_evolution` na retrospectiva + dev-story + code review? (S/N)

---

#### Ferramenta 11: `get_changes_since`

**Função:** O que mudou desde minha última sessão (session anchor).

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| Session start (qualquer) | Todos os agentes | "Execute `get_changes_since` no repo para ver o que mudou desde a última sessão." |

**Pergunta:** Instalar `get_changes_since` no início de qualquer sessão BMAD? (S/N)

---

#### Ferramenta 12: `get_process_flow`

**Função:** Passo a passo de um fluxo de execução (ex: POST /login → auth → session → DB).

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| QA | Murat — QA (`/bmad-tea`) | "Para o processo [Nome], execute `get_process_flow`. Cada step do fluxo deve gerar pelo menos um caso de teste." |
| `bmad-code-review` (Acceptance Auditor) | Amelia — Dev (`/bmad-code-review`) | "Execute `get_process_flow` do fluxo alterado. Cada step = um AC. Verifique cobertura." |
| Debugging | Amelia — Dev (`/bmad-quick-dev`) | "Execute `get_process_flow` para traçar o caminho completo da requisição com erro." |

**Pergunta:** Instalar `get_process_flow` no QA e Acceptance Auditor? (S/N)

---

#### Ferramenta 13: `list_processes`

**Função:** Todos os fluxos de execução detectados no código.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| QA | Murat — QA (`/bmad-tea`) | "Execute `list_processes` e faça cross-reference com specs em `e2e/`. Liste fluxos sem cobertura E2E." |
| `bmad-sprint-planning` | Amelia — Dev (`/bmad-sprint-planning`) | "Execute `list_processes` para mapear o escopo funcional completo do sistema." |

**Pergunta:** Instalar `list_processes` no QA e sprint-planning? (S/N)

---

#### Ferramenta 14: `list_communities`

**Função:** Módulos lógicos detectados (Louvain community detection).

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-retrospective` | Amelia — Dev (`/bmad-retrospective`) | "Execute `list_communities` e compare com a estrutura de pastas. Detecte god-modules." |
| `bmad-create-architecture` | Winston — Architect (`/bmad-agent-architect`) | "Rode `list_communities`. Valide se a arquitetura real reflete a planejada." |

**Pergunta:** Instalar `list_communities` na retrospectiva e create-architecture? (S/N)

---

#### Ferramenta 15: `get_api_topology`

**Função:** Quem chama qual endpoint — topologia cross-service.

**Integrações possíveis:**

| Workflow | Agente (comando) | Prompt |
|----------|-------------------|--------|
| `bmad-dev-story` (pré-API change) | Amelia — Dev (`/bmad-agent-dev`) | "Execute `find_api_endpoints` e `find_api_calls` para ver todos os consumers antes de alterar a assinatura." |
| `bmad-check-implementation-readiness` | Winston — Architect (`/bmad-agent-architect`) | "Rode `get_api_topology` para mapear dependências cross-service." |
| `bmad-code-review` | Amelia — Dev (`/bmad-code-review`) | "Mudança de endpoint? Rode `get_api_topology` e verifique todos os consumers." |

**Pergunta:** Instalar `get_api_topology` no dev-story e readiness check? (S/N)

---

### Phase 2: Scope — Per-Project or Global?

**After all 15 tools have been processed, ask the user:**

> "As integrações serão instaladas via `bmad-customize`, que cria arquivos `.toml` de override — sem modificar os skills originais. Assim, as configurações sobrevivem a updates do BMAD."
>
> "**Onde instalar?**"
> - **[P] Por projeto** — arquivos em `{project-root}/_bmad/custom/` (versionado no repositório, afeta só este projeto)
> - **[G] Global** — arquivos em `{user-home}/.bmad/custom/` (afeta TODOS os projetos BMAD na máquina)
>
> "**Recomendação:** Use [P] por projeto, a menos que você queira que TODOS os seus projetos usem as mesmas regras de Memtrace."

Wait for answer. Store `install_scope` as `project` or `global`. Map to path:
- `project` → `{project-root}/_bmad/custom/`
- `global` → `{user-home}/.bmad/custom/`

---

### Phase 3: Apply — 3-Level Installation Strategy

> **IMPORTANTE:** NÃO edite os arquivos `SKILL.md` originais. Use APENAS `bmad-customize` (arquivos `.toml` de override). Isso garante que as integrações sobrevivam a `bmad update`.

Instale em 3 níveis:

---

#### Nível 1: `activation_steps_prepend` — Ferramentas que rodam AUTOMATICAMENTE ao iniciar o workflow

Cada agente recebe um arquivo `.toml` com `activation_steps_prepend`. Esses steps executam **sem o usuário precisar pedir** — quando ele chama `/bmad-code-review`, o agente já inicia rodando `get_evolution` e `find_most_complex_functions` antes de qualquer análise.

**Formato do arquivo:**
```toml
# {install_scope_path}/bmad-{skill-name}.toml
[workflow]
activation_steps_prepend = [
    "Memtrace: execute get_evolution no branch atual...",
    "Memtrace: execute find_most_complex_functions...",
]
persistent_facts = [
    "ANTES de editar qualquer função, execute get_impact...",
]
```

**Agentes e suas ativações automáticas:**

| Arquivo | Agente | Roda automaticamente ao iniciar |
|---------|--------|--------------------------------|
| `bmad-dev-story.toml` | Amelia — Dev (`/bmad-agent-dev`) | `get_codebase_briefing` + `find_code` na feature |
| `bmad-code-review.toml` | Amelia — Dev (`/bmad-code-review`) | `get_evolution` no branch + `find_most_complex_functions` vs main |
| `bmad-retrospective.toml` | Amelia — Dev (`/bmad-retrospective`) | `get_evolution` + `find_most_complex_functions` + `find_dead_code` + `find_central_symbols` |
| `bmad-tea.toml` | Murat — QA (`/bmad-tea`) | `list_processes` + `find_symbol` nas funções exportadas |
| `bmad-sprint-planning.toml` | Amelia — Dev (`/bmad-sprint-planning`) | `get_codebase_briefing` + `find_most_complex_functions` |
| `bmad-correct-course.toml` | Amelia — Dev (`/bmad-correct-course`) | `get_evolution` desde início da sprint + `get_impact` nos novos targets |
| `bmad-agent-pm.toml` | John — PM (`/bmad-agent-pm`) | `get_codebase_briefing` + `find_most_complex_functions` |
| `bmad-agent-architect.toml` | Winston — Architect (`/bmad-agent-architect`) | `list_communities` + `get_api_topology` |
| `bmad-quick-dev.toml` | Amelia — Dev (`/bmad-quick-dev`) | `find_code` com a mensagem de erro |

**Para cada agente aceito:** crie o arquivo `.toml` correspondente com `activation_steps_prepend` + `persistent_facts`.

---

#### Nível 2: `persistent_facts` — Instruções que o agente considera DURANTE toda a sessão

Instruções reativas — o agente as carrega como contexto e aplica nos momentos certos (ex: "ANTES de editar, get_impact", "DURANTE implementação, find_code para padrões"). Não são steps rígidos, mas diretrizes que o agente segue conforme o fluxo.

---

#### Nível 3: CI/CD gates (`.github/workflows/ci.yml`)

**Apenas se o usuário aceitou** `find_most_complex_functions` e/ou `find_dead_code` como gates de CI: gere a configuração YAML e ofereça para escrever em `.github/workflows/ci.yml`.

> ⚠️ **CI gates são gerados mas NÃO aplicados automaticamente.** Revise e adapte ao pipeline existente.

---

### Phase 4: Summary

Print a summary table:

```
✅ INSTALAÇÃO CONCLUÍDA — {install_scope}

Arquivos criados em {install_scope_path}:

| Arquivo | Agente | Nível |
|---------|--------|-------|
| bmad-dev-story.toml | Amelia — /bmad-agent-dev | 1 + 2 |
| bmad-code-review.toml | Amelia — /bmad-code-review | 1 + 2 |
| ... | ... | ... |

📋 Nível 1 (activation_steps_prepend): Ferramentas que rodam AUTOMATICAMENTE ao iniciar o workflow
📋 Nível 2 (persistent_facts): Instruções que o agente considera durante toda a sessão
⚠️  Nível 3 (CI gates): Gerado mas NÃO aplicado — revise .github/workflows/ci.yml

🔄 As integrações sobrevivem a `bmad update` (override files, não SKILL.md).
🗑️  Para remover, delete o arquivo .toml correspondente.
```

### 🤖 LLM INSTRUCTION BLOCK — END

---

> 📊 O caso real de uso está documentado no topo deste guia: [Caso Real: Impacto do Memtrace num Projeto BMAD](#-caso-real-impacto-do-memtrace-num-projeto-bmad)
