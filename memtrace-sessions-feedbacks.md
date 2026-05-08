# Session Analysis Protocol - Memtrace

**Scope Instruction:** Analyze only the actions and data generated within the current session (present execution context). Include interactions from other agents only if they occurred within this specific flow. Do not evaluate historical data from previous sessions. You can use the Memtrace documentation if you need.

**Should you create a entry?** Edit this file ONLY if:
- You used memtrace in the session
- You could have use it to improve your actions but didn't for some reason (ex: customization didn't have the right tools, customization loaded too late, you didn't have access to memtrace, etc).

### 1. Analysis Dimensions
Evaluate the session based on the following criteria:
- **Memtrace Utilization:** How was Memtrace effectively deployed during this session?
- **Counterfactual Analysis:** What would the result or required effort look like without Memtrace?
- **Measurable Gains:** Identify quantitative or structural improvements (efficiency, accuracy, time). Be conservative if using time. Don't overstate.
- **Usage Optimization:** How could the I/The agents have utilized Memtrace Tools more effectively within this specific session?
- **Feature Recommendation:** What technical capability is missing in Memtrace to facilitate this specific workflow?

### 2. Validation & Deduplication
- **Optimization Check:** Before recording new "Usage Optimization" points, verify if they already exist in the file. Do not duplicate entries.
- **Context Check:** Before suggesting improvements, verify if they are already part of your current customization instructions or context. If already implemented or configured, ignore.

### 3. Feature Suggestion Constraints
Only add items to the "Feature Recommendation" section if they meet the following three requirements:
1. **Technical Feasibility:** Must be possible to implement within the software architecture.
2. **Platform-Level Requirement:** The feature must require changes to Memtrace's code or infrastructure (cannot be resolved via prompt engineering or agent-side logic).
3. **Substantive Value:** If no suggestion meets these criteria, leave this field blank.

### 4. Results Logging
Record the findings strictly following the formatting pattern and structure established by previous agents in this file.

## Template (copy for each session)

```yaml
session:
  epic: "[epic tag – e.g. epic-housekeeping, epic-3]"
  process: "[process tag – e.g. criação de epico, criação de story x-x, implementação de story hk-1, revisao pos-dev, etc.]"
  date: "[YYYY-MM-DD]"
  agent: "[model name]"
  commits: "[sha1] [sha2] ..."
```

---

# Memtrace Session Log – Story HK.1

**Epic:** epic-housekeeping
**Process:** implementação de story hk-1
**Session:** 2026-05-06 – Refactor DayDetailSheet and updateEvent
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `9f75341` `0ef7f98` `87fe22a`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Pre-dev | `get_codebase_briefing` | Discover repo scale, modules, high-risk symbols before writing anything |
| Pre-dev | `find_code` (calendar-related) | Locate exact symbol positions without grepping |
| Pre-dev | `get_changes_since` | See what was touched recently in the same files |
| Before each edit | `get_impact(updateEvent)` | Blast-radius check: LOW risk – safe to refactor |
| Before each edit | `get_impact(DayDetailSheet)` | Same check for the component |
| Post-impl | `get_evolution` | Detect unintended changes outside story scope |
| Post-impl | `find_dead_code` | Ensure no new symbol was introduced without a caller |
| Code review prep | `find_most_complex_functions` | Validate complexity reduction targets |
| After final commit | `index_directory(incremental)` | Reindex the graph after all changes landed |

---

## 2. Counterfactual Analysis

- **Onboarding**: Read 10–15 files manually to understand architecture before touching anything
- **Refactoring risk**: Manual grep for imports of `DayDetailSheet` and `updateEvent` – easy to miss a consumer
- **Dead code**: No systematic way to catch orphaned symbols; would only surface at runtime or never
- **Complexity validation**: Would need a linter rule or manual review; no pre/post comparison
- **Post-commit safety**: No way to detect scope creep / unintended changes without reading every diff manually
- **Code review**: Each layer would require manual searching; no graph evidence to back findings

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to understand the target area | 2 calls (`briefing` + `find_code`) | Reading 10+ files, cross-referencing imports |
| Confidence to refactor monolithic functions | `get_impact – LOW` eliminated fear | "Hope it doesn't break" |
| Dead symbols caught | 0 new dead symbols (verified) | Unknown – optimism bias |
| Scope creep detected | `get_evolution` after each commit | Manual diff review, easy to miss |
| Code review evidence | Graph-backed triage (MUST-FIX, SHOULD-FIX) | Subjective opinion |
| File lock issue on Windows | Cost ~5 min to diagnose + workaround | Doesn't apply |

---

## 4. Feature Recommendation

### 4.1. Before the first edit – deeper blast radius

I called `get_impact` before editing `updateEvent` and `DayDetailSheet`, but I didn't call `get_symbol_context` on the inline functions (`renderEvent`, `isOwnEvent`) before removing them. **Insight**: when deleting code, call `find_symbol` on every deleted function to rule out external references (even when they look internal).

### 4.2. For test coverage mapping

`list_processes` + `get_process_flow` would have helped identify which execution flows lack test coverage before writing new tests. Instead, I discovered gaps only during the QA audit. **Insight**: run `list_processes` as a test-planning step, not a post-mortem.

### 4.3. Bridge-symbol check for extracted helpers

When I moved `authorizeAndFetchEvent`, `buildUpdateData`, `recomputeConflicts` to `helpers.ts`, I should have run `find_bridge_symbols` on the new file. If any of those helpers become widely imported, they become chokepoints. **Insight**: run bridge check on new shared modules early, not after they accumulate callers.

### 4.4. Auto-index on commit

The manual `replay_history` – `index_directory` dance after every commit is friction. If `watch_directory` also watched `.git/refs/heads/*` and triggered the indexing chain on commit, the post-commit `get_evolution` and `find_dead_code` checks would be instant. This was requested as a feature.

### 4.5. Windows file-lock handling

`index_directory` fails when `watch_directory` holds an ArcadeDB handle. Workaround: `unwatch` – `index` – `watch`. A proper fix (retry with backoff, or auto-detach the mapped section) would remove the friction entirely. Bug report filed with Memtrace team.

---

### 5. What is a good feature Memtrace could have to help me better?

---

# Memtrace Session Log – Create Story HK.1

**Epic:** epic-housekeeping
**Process:** criação de story hk-1 (create-story workflow)
**Session:** 2026-05-06 – Context engine – análise para story file HK.1
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `6ed328d`

---

## 1. How Memtrace Was Used

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Activation | `get_codebase_briefing` | Repo scale, modules, high-risk symbols before creating story |
| Dep. intelligence | `get_symbol_context(updateEvent)` | Callers (1), callees (6), processo (CollectiveDashboardPageProcess) |
| Dep. intelligence | `get_symbol_context(DayDetailSheet)` | Callers (1), callees (10), funções inline (isOwnEvent, renderEvent) |
| Risk flagging | `get_impact(updateEvent)` | Blast radius: LOW – sem bloqueio arquitetural |
| Risk flagging | `get_impact(DayDetailSheet)` | Blast radius: LOW – sem bloqueio arquitetural |
| Source reading | `find_symbol(updateEvent)` | Localizar posição exata no código |
| Source reading | `find_symbol(DayDetailSheet)` | Localizar posição exata no código |
| Hidden deps | `find_dependency_path(DayDetailSheet – getViewerContext)` | Caminho indireto: DayDetailSheet – updateEvent – getViewerContext (depth 2) |
| AC traceability | `get_process_flow(CollectiveDashboardPageProcess)` | 82 steps. updateEvent=step 20, DayDetailSheet=step 16. AC1 (subcomponentes) e AC2 (complexidade) mapeiam para steps distintos. |
| Story ordering | `find_dependency_path(updateEvent – fetchCrossCollectiveEvents)` | SEM caminho – HK.1 e HK.2 são independentes, ordenação válida |

## 2. What It Would Look Like Without Memtrace

- **Dependency intelligence**: Read both `.ts` files + cross-reference imports manually to find all callers/callees of updateEvent
- **Risk assessment**: No blast-radius data – would guess whether refactoring is safe
- **Hidden deps**: Would not know that DayDetailSheet – updateEvent – getViewerContext is the auth chain; might extract only the obvious callers
- **Process/AC mapping**: Would manually trace the 82-step dashboard flow – error-prone, easy to miss steps
- **Story ordering**: Would assume HK.1 before HK.2 is correct based on intuition; no graph evidence

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to map dependencies | 2 calls (`symbol_context`) | Reading 2 source files + grepping imports (~15 min) |
| Hidden dependency chain discovered | DayDetailSheet – updateEvent – getViewerContext (load-bearing) | Would require reading all 3 files and tracing manually |
| Process step mapping | 82 steps in 1 call | Manual tracing through 82+ function calls |
| AC – flow mapping confidence | updateEvent (step 20) + DayDetailSheet (step 16) | "Parece que cobre" – sem evidência |
| Story ordering validation | No path between HK.1 and HK.2 – independentes | Intuição sem dados |

## 4. How It Could Be Used Better

### 4.1. Process flow analysis antes do create-story

`get_process_flow` foi chamado, mas apenas depois do story file criado. **Insight**: chamar `get_process_flow` ANTES de escrever o story file, para que os steps do fluxo já alimentem as ACs diretamente.

### 4.2. find_central_symbols como input de hidden deps

Os load-bearing symbols (`getViewerContext`, PageRank top-10) foram descobertos apenas no segundo round. **Insight**: rodar `find_central_symbols` no início e cross-referenciar com os targets da story – se um target depende de um símbolo central, isso é hidden risk não documentado.

## 5. What is a good feature Memtrace could have to help me better?

---

# Memtrace Session Log – Story HK.2 (Create)

**Epic:** epic-housekeeping
**Process:** criação de story hk-2
**Session:** 2026-05-06 – Create Story HK.2 – RLS divergence + race condition
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** (story file created, not yet committed)

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Prep (customization) | `get_codebase_briefing` | Briefing loaded via activation_steps_prepend – repo scale, modules, 585 symbols |
| Prep (customization) | `find_symbol(fetchCrossCollectiveEvents)` | Caller/callee map for the race-condition target (D5) |
| Prep (customization) | `find_symbol(filterEventForViewer)` | Caller map for the RLS divergence target (D3) |
| Prep (customization) | `get_symbol_context(useCrossCollectiveEvents)` | Full 360° view: callers (CalendarGridClient), callees (fetchCrossCollectiveEvents), process membership |
| Prep (customization) | `get_impact(filterEventForViewer)` | Blast-radius: LOW – RLS fix touches only SQL, not app-layer |
| Pre-write | Explore subagent | Discovered 21 files via grep/glob/read – RLS SQL, visibility.ts, hooks.ts, store.ts, events-queries.ts, types.ts, tests |

**Note:** The `activation_steps_prepend` customization configured Memtrace tools for story creation, but the heavy code discovery was delegated to the explore subagent (grep/glob), not direct Memtrace calls. The subagent returned complete file contents for all 21 relevant files.

---

## 2. Counterfactual Analysis

- **Scope definition**: Without Memtrace's `get_impact`, would not have known `filterEventForViewer` has zero blast radius (RISK LOW, 0 affected files) – confidence to leave it untouched
- **Symbol discovery**: Manual grep for `events_select_policy` would have found the SQL file but Memtrace's `find_symbol` confirmed `filterEventForViewer` is isolated – no need to touch visibility.ts
- **Race condition analysis**: `get_symbol_context(useCrossCollectiveEvents)` revealed the exact inline code still has `setCrossEvents(result)` in `queryFn` (confirmed by indexed graph)
- **Process membership**: `useCrossCollectiveEvents` belongs to `CollectiveDashboardPageProcess` at step 13 – useful for understanding where in the render cycle the fix sits

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to verify filterEventForViewer is safe to leave alone | 1 call (`get_impact – LOW`) | Manual review of 32-line function + cross-reference callers |
| Confidence in RLS-only scope | `get_impact = 0 affected files` | "Hope it doesn't affect visibility.ts" |
| Understanding race condition location | `get_symbol_context` showed exact code inline | Read hooks.ts manually |
| Story file quality | 21 file contents from subagent + Memtrace metrics – precise dev notes | Surface-level from epic only |

---

## 4. Usage Optimization

- **Use Memtrace FIRST, not subagent**: The explore subagent used grep/glob/read instead of Memtrace `find_code`/`find_symbol`, which would have been faster and more precise. Next time: call Memtrace tools directly before delegating to a subagent.
- **`get_evolution` post story creation**: Not called after writing the story file – would catch if any unintended artifacts were modified. Add as a checklist step.
- **`find_dead_code` for SQL migrations**: Not applicable since no new TS symbols were introduced, but worth noting for future stories that create Server Actions.

---

## 5. Feature Recommendation

### 5.1. SQL/RLS-aware symbol search

Memtrace currently indexes only source-code symbols (TypeScript, Rust, etc.). RLS policies defined in `.sql` migration files are opaque to the graph. A feature to index PostgreSQL policy definitions (`CREATE POLICY ... ON ... FOR SELECT USING (...)`) as graph nodes would enable:
- Tracing which tables have RLS and which roles they affect
- `get_impact` for SQL migrations showing affected queries
- Cross-reference between app-layer visibility functions and their RLS counterparts

### 5.2. Story creation as an indexed episode

When `create-story` produces a story file, registering it as an `agent_intent` episode (via `record_external_episode`) would make the story creation appear in `get_evolution` timelines – so downstream agents can see "story hk-2 was created at T, then implemented at T+1".

---

**Filed:** 2026-05-06

---

# Memtrace Session Log – Story HK.2 (Implementation + Code Review + QA)

**Epic:** epic-housekeeping
**Process:** implementação de story hk-2 + code review + QA analysis (Murat)
**Session:** 2026-05-06 – RLS divergence, race condition fix, code review, Murat QA
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `f81a9db` `eab9d6d` `eb9aa30`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Pre-dev (activation) | `get_codebase_briefing` | Repo scale (574 symbols), modules, high-risk symbols |
| Pre-dev (activation) | `find_code` (events_select_policy, RLS, cross-collective) | Locate exact files without grepping |
| Pre-dev (activation) | `get_changes_since` | Recent changes in the repo |
| Post-impl check | `get_evolution` (compound) | Detect scope creep after implementation |
| Post-impl check | `find_dead_code` | Verify no new symbols without callers |
| Post-commit reindex | `index_directory` (incremental) | Graph update after final commit (worked on retry) |
| Post-reindex | `get_evolution` (compound) | Final check – no unintended changes |
| Post-reindex | `find_dead_code` | Final check – all symbols have callers |
| Code review prep | `get_evolution` (compound, wider window) | Baseline for code review context |
| QA analysis (Murat) | `list_processes` | Enumerate execution flows for test gap analysis |
| QA analysis (Murat) | `find_symbol(useCrossCollectiveEvents)` | Verify callers and complexity |

---

## 2. Counterfactual Analysis

- **RLS SQL files**: Without `find_code`, would have manually grepped `events_select_policy` across migrations – 2 SQL files em vez de 1 call
- **Race condition analysis**: Manual reading of `hooks.ts` to identify the `setCrossEvents` in `queryFn` – `get_changes_since` confirmed it was the only change needed
- **Post-impl safety**: `get_evolution` after each commit would require manual diff review – 3 commits + multi-file diffs vs. 1 compound query
- **Dead code verification**: `find_dead_code` would require reading every test file to check for orphaned test references – 0 new dead symbols confirmed in 1 call
- **Code review context**: Without Memtrace, the code review prompts for Gemini would have no graph-backed evidence (blast radius, evolution impact)
- **QA gap analysis**: `list_processes` + `find_symbol` would require manually reading all hook files and tracing flow membership – 2 calls vs. 30+ file reads

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to find RLS target | 1 call (`find_code`) | Grepping `010_events_rls.sql` + reading 38 lines |
| Time to find race condition target | 1 call (`get_changes_since`) | Manual review of `hooks.ts` history |
| Post-impl regression detection | `get_evolution` after each commit | Manual diff-by-diff review |
| Dead code confidence | `find_dead_code` – 0 new | Optimism bias |
| Code review prompt quality | `get_evolution` backed 10 dismissed findings with evidence | Subjective opinion in prompts |
| QA flow enumeration | `list_processes` – 50 processes listed | Manual review of `src/features/calendar/` |

---

## 4. Usage Optimization

### 4.1. Missed activation prepends for code review

The `bmad-code-review` skill's `activation_steps_prepend` specifies `find_most_complex_functions(top_n=15)`, `find_dead_code(limit=30)`, and `find_bridge_symbols` as prep steps. Because the user requested prompt creation (not full workflow execution), these were skipped. **Insight**: even when generating prompts for external execution, running the prep steps adds real data to the prompt payload that the external model can use.

### 4.2. `get_process_flow` not called for QA

`list_processes` was called (50 processes), but `get_process_flow` on `CollectiveDashboardPageProcess` was not – that would have revealed exactly which flow steps the race condition fix (step 13 of 82) and RLS change participate in. **Insight**: pair `list_processes` – `get_process_flow` for any QA analysis that needs step-level traceability.

### 4.3. `get_impact` skipped for code review prompts

When generating the Acceptance Auditor prompt, `get_impact(useCrossCollectiveEvents)` would have provided blast-radius evidence to include in the prompt – showing exactly which files the hooks change touches. **Insight**: for any prompt that claims to be "self-contained", include Memtrace graph evidence (blast radius, symbol context) to match what an online reviewer would query.

---

## 5. Feature Recommendation

### 5.1. Multi-session code review artifact tracking

Currently, when generating prompts for external execution (Gemini), there's no way to link the results back as episodes in the Memtrace timeline. If `record_external_episode` accepted a `findings_summary` metadata field and an optional `source_type: external_review`, the code review results could appear in `get_evolution` alongside the implementation timeline.

### 5.2. Git-aware file lock reindex

On Windows, `index_directory` (incremental) fails with `os error 1224` when a memory-mapped section is open. Workaround: retry after 1s. A built-in retry (exponential backoff, 3 attempts) would eliminate the manual retry friction entirely.

---

# Memtrace Session Log – Story HK.4 (Create)

**Epic:** epic-housekeeping
**Process:** criação de story hk-4 (create-story workflow)
**Session:** 2026-05-06 – Pipeline CI 2.0 + Unificação DB
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `9257e18`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Activation (prepend) | `get_codebase_briefing(summary)` | Repo scale (585 symbols), 5 high-risk, 80 dead-code candidates |
| Post-hoc (follow-up) | `find_code` (CI, global-setup) | Confirm CI pipeline symbols not indexed (YAML – opaque to graph) |
| Post-hoc (follow-up) | `find_code` (global-setup seed) | Found `seedDatabase` function + process node for globalSetup |

**Missing calls (customization prescribed but skipped):**
- `get_symbol_context` on targets – not called (hk.4 targets are YAML/JS config files, not TS symbols)
- `get_impact` on CI pipeline – not applicable (no TS symbol to trace)
- `find_dependency_path` between hk-4 and hk-5 – not called
- `get_process_flow` – not called (no TS flow to trace for infra pipeline)

---

## 2. Counterfactual Analysis

- **File analysis**: Without direct file reads, I would have no way to understand the CI pipeline (YAML, not TS). Memtrace doesn't index `.yml`/`.mjs`/config files – the entire story foundation was built from `Read` + `grep` on raw files
- **Previous story intelligence**: HK.3 story file was read directly (markdown), not via Memtrace
- **Symbol verification**: `find_code` confirmed `globalSetup` has a process node, but for infrastructure stories, the graph adds minimal value
- **Web research**: All version/API research was done via web search – Memtrace doesn't track npm package versions

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Repo scale awareness | `get_codebase_briefing` – 585 symbols | Manual directory traversal |
| Infrastructure files discovered | Via `Read` (not Memtrace) | Same – YAML/infra not indexed |
| Dependency mapping | Not applicable – hk.4 targets are infra files | Same – no TS symbols to trace |

**Note:** This story targets infrastructure files (`.github/workflows/ci.yml`, `scripts/migrate.mjs`, `playwright.config.ts`, `package.json`, `.nvmrc`). Memtrace's value was limited to the codebase briefing since these files are outside the TS/JS AST index.

---

## 4. Usage Optimization

### 4.1. Infrastructure-awareness gap

The activation prepend customization assumes every story has a TS symbol target. Stories like HK.4 (CI pipeline, DB migration, Playwright config, package.json) touch zero TypeScript symbols. The prepend steps should detect when the story's primary targets are non-TS files and skip/short-circuit Memtrace dependency calls.

### 4.2. Post-hoc Memtrace not useful for infra stories

Running `find_code` after the story was written confirmed the graph doesn't index YAML, JSON, or MJS files. For future infra stories, skip Memtrace dependency intelligence and go directly to `Read` + `grep`.

### 4.3. `get_codebase_briefing` remains useful

Even for infra stories, knowing the codebase scale (585 symbols) and high-risk functions provides context – e.g., "422 tests must pass" is actionable for CI changes.

---

## 5. Feature Recommendation

### 5.1. YAML/JSON/config indexing

Memtrace currently indexes only source-code AST symbols. For stories that modify CI pipelines, Playwright configs, or package.json, the graph is blind to the most critical files. A feature to index YAML `jobs`, `steps`, `with:` keys and JSON `scripts`, `dependencies` as graph nodes would enable:
- `get_impact` for CI pipeline changes (which jobs depend on which)
- Cross-reference between CI job names and their Playwright/script targets
- Traceability: "changing `test:e2e` script affects CI job X and local dev command Y"

### 5.2. Process flow for non-TS execution graphs

`get_process_flow` is limited to TS call chains. A CI pipeline is also an execution graph (job – step – action). If Memtrace could parse GitHub Actions workflow files into process nodes, infra stories like HK.4 would benefit from flow tracing: "step `db-migrate` feeds into `lint-and-test` – removing the dependency affects 2 jobs."

---

**Filed:** 2026-05-06

---

# Memtrace Session Log – Murat QA Review for HK.4

**Epic:** epic-housekeeping
**Process:** QA analysis – Murat review of story HK.4 (Pipeline CI 2.0 + Unificação DB)
**Session:** 2026-05-06 – Murat QA: risk analysis, Playwright hardening, CI best practices
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** (review only – story file updated, no code changes)

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Activation (prepend) | `list_indexed_repositories` | Verify repo is indexed before analysis |
| Activation (prepend) | `list_processes` | Enumerate execution flows (50 processes) – prep step 1 |
| Activation (prepend) | Glob `e2e/*.spec.ts` | Cross-reference flows with E2E coverage – prep step 2 (12 specs found) |
| Source reading | `Read` (ci.yml, playwright.config.ts, global-setup.ts, package.json) | State analysis for 4 target files (infra/config – não indexados) |
| Knowledge loading | `Read` (ci-burn-in.md, test-quality.md, test-priorities-matrix.md) | TEA knowledge fragments for CI recommendations |

**Prepend step 3 (find_symbol on modified files) skipped:** não há arquivos modificados – sessão é pré-dev review, não implementação.

---

## 2. Counterfactual Analysis

- **CI workflow analysis**: Sem Memtrace, leria `ci.yml` da mesma forma (YAML não é indexado). Sem ganho – arquivo lido com `Read` igual.
- **E2E test discovery**: Glob nativa achou 12 specs – `find_code` do Memtrace não adicionaria valor (specs estão em disco, não no grafo de símbolos).
- **Playwright config gap detection**: `forbidOnly` ausente, `retries: 0`, `workers` default – descobertos por leitura direta do config, não por Memtrace. São quebras de boas práticas, não de referência de símbolo.
- **Seed determinismo**: `ON CONFLICT` identificado por leitura do `global-setup.ts`, não por análise de grafo.
- **Valor do Memtrace**: Para stories de infra/config, `list_processes` e `list_indexed_repositories` são os únicos calls relevantes – o core da análise é leitura de arquivos e conhecimento de domínio (CI/CD, Playwright, TEA fragments).

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Activation flow enumeration | 1 call (`list_processes` – 50 flows) | Manual catalog of `src/features/` directories |
| E2E spec list | 1 glob (12 specs) | Same – glob is same cost |
| CI quality diagnostics | Manual read of 94-line YAML | Same – file not indexable |
| Playwright guardrail audit | Read of 23-line config | Same – file not indexable |
| Story file update | 6 edits covering 16 new recommendations | Would need manual cross-reference with best practices |

**Note for infra stories:** ~80% of the analysis effort was file reading (config/YAML/JSON) + domain knowledge (TEA fragments). Memtrace contributed ~20% (process enumeration + repo status verification). This is the inverse of code-indexed stories (HK.1, HK.2) where Memtrace contributed ~80%.

---

## 4. Usage Optimization

### 4.1. `get_evolution` não chamado

Diferente das sessões HK.1/HK.2, `get_evolution(mode=compound)` não foi executado na ativação. Para uma story que modifica o pipeline CI, `get_evolution` poderia ter revelado:
- Se o `ci.yml` foi alterado recentemente (mudanças nos steps de E2E)
- Se `playwright.config.ts` ou `global-setup.ts` tiveram modificações nas últimas sprints
- Se há working-tree não commitado que impacta a análise

**Insight**: adicionar `get_evolution` como prep step obrigatório para TODAS as sessões, inclusive QA review – mesmo que os targets sejam infra, as dependências de código podem ter mudado.

### 4.2. Prep step 3 ignorado sem substituição

O prep step 3 (`find_symbol` em exported functions de modified files) foi ignorado porque "não há arquivos modificados". Mas para uma sessão de QA review, `find_most_complex_functions(top_n=15)` ou `find_bridge_symbols` teriam identificado hotspots arquiteturais que poderiam influenciar a priorização de testes.

**Insight**: prep steps de sessões de dev não se aplicam diretamente a sessões de QA. Customizar `activation_steps_prepend` por tipo de sessão (dev vs. review vs. QA) evitaria gaps.

### 4.3. `find_code` para Playwright utils não chamado

A análise recomendou padrões como `forbidOnly`, `retries`, `workers`, mas não verificou se o projeto já utiliza `@playwright/test` utilities específicas (mergeReports, sharding, etc.). `find_code(@playwright/test)` teria mostrado o padrão de importação atual.

**Insight**: mesmo para stories de infra, `find_code` com palavras-chave do framework (ex: `playwright`, `drizzle-kit`) pode revelar o padrão de uso atual antes de recomendar mudanças.

### 4.4. `get_process_flow` não pareado com `list_processes`

`list_processes` retornou 50 processos, mas nenhum `get_process_flow` foi executado. O CI pipeline em si não é um processo do Memtrace (YAML não indexado), mas processos como `GlobalSetup` (entry point do seed E2E) poderiam ter sido traçados para verificar se o seed cobre todos os steps necessários para os E2E existentes.

**Insight**: após `list_processes`, executar `get_process_flow` no processo `GlobalSetup` – isso revelaria a cadeia de chamadas do seed, validando se o determinismo proposto (DELETE + INSERT) cobre todas as tabelas tocadas.

---

## 5. Feature Recommendation

### 5.1. Análise de qualidade de config como serviço

As ferramentas atuais de análise de config (playwright.config, CI YAML) exigem leitura manual + conhecimento de domínio. Se o Memtrace indexasse arquivos de config como nós `ConfigFile` com validações conhecidas (ex: "playwright.config sem forbidOnly = violação de boas práticas"), a análise de QA para stories de infra seria automatizada – reduzindo os 80% de leitura manual para consultas ao grafo.

---

**Filed:** 2026-05-06

---

# Memtrace Session Log — Story HK.4 (Implementation)

**Epic:** epic-housekeeping
**Process:** implementação de story hk-4 — Pipeline CI 2.0 + Unificação DB
**Session:** 2026-05-07 — CI restructuring, DB migration unification, E2E seed fix, code review patches
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `c5c2882` (merge PR #31)

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Pre-dev (activation) | `get_codebase_briefing(summary)` | Repo scale (585 symbols), high-risk symbols |
| Pre-dev (activation) | `find_code` (CI pipeline, Playwright, migration) | Locate CI artifacts — graph blind to YAML/JSON |
| Pre-dev (activation) | `get_changes_since` | Recent changes in the repo |
| Post-impl check | `get_evolution` (compound) | Detect scope creep after implementation |
| Post-impl check | `find_dead_code` | Verify no new symbols without callers |
| After code review | `get_evolution` (compound) | Final check after adversarial review patches |
| After code review | `find_dead_code` | Final dead-code verification |

## 2. Counterfactual Analysis

- **CI pipeline understanding**: Without Memtrace, would have manually read `ci.yml`, `playwright.config.ts`, `e2e/global-setup.ts` via `Read` — same effort (Memtrace doesn't index YAML/JSON/config)
- **Symbol search**: `find_code` for CI-related patterns had limited value — primary targets were config files, not TS symbols
- **Post-impl safety**: `get_evolution` confirmed no unintended scope creep across multiple commits — would require manual diff review across 9 files changed
- **Dead code verification**: `find_dead_code` — 0 new dead symbols — would rely on optimism bias without Memtrace
- **Code review prompts**: Generated 3 self-contained prompts (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — the diff was the primary input, Memtrace graph data was not embedded

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Briefing before implementation | 1 call (`get_codebase_briefing`) | Manual directory traversal |
| Post-impl regression detection | `get_evolution` (compound) after each phase | Manual diff-by-diff review across 8+ commits |
| Dead code confidence | `find_dead_code` — 0 new dead symbols verified | Optimism bias |
| Code review artifact quality | Pre-populated prompts with full diff + spec + ACs | Subjective opinion in review prompts |
| Post-fix validation | `get_evolution` after code review patches | Manual re-check of each patch |

**Note for infra stories (HK.4):** ~60% of analysis effort was file reading (YAML/JSON/TS config). Memtrace contributed ~40% (briefing + post-impl checks + dead code). This is lower than code-indexed stories (HK.1, HK.2) where Memtrace contributed ~80%.

## 4. Usage Optimization

### 4.1. Code review prompts sem contexto do Memtrace

Ao gerar os 3 prompts de code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor), não incluí dados do grafo do Memtrace como `get_impact` ou `get_symbol_context`. O Acceptance Auditor, por exemplo, teria se beneficiado de saber que `global-setup.ts` não tem callers formais (Playwright carrega via `require.resolve`). **Insight**: para prompts autossuficientes, incluir evidência de grafo (blast radius, contexto de símbolo) — mesmo que o revisor externo não tenha acesso ao Memtrace.

### 4.2. `get_impact` não chamado antes das correções pós-review

Após o code review adversarial (3 patches), não chamei `get_impact` nos arquivos modificados (`ci.yml`, `global-setup.ts`, `playwright.config.ts`). Como são arquivos de config/infra (não TS symbols), o impacto seria zero — mas a verificação não foi feita. **Insight**: para patches em arquivos TS (ex: `global-setup.ts`), chamar `get_impact(globalSetup)` antes e depois confirma que a reordenação dos DELETEs não afetou consumers externos.

### 4.3. `get_process_flow` no GlobalSetup não chamado

O `list_processes` (rodado nas sessões anteriores) lista `GlobalSetup` como um processo, mas `get_process_flow(GlobalSetup)` não foi chamado nesta sessão. Isso teria revelado a cadeia completa de chamadas do seed E2E, validando que a reordenação `events → artists → profiles` cobre todas as tabelas tocadas. **Insight**: após refatorar a ordem de DELETEs no `global-setup.ts`, parear `list_processes` + `get_process_flow(GlobalSetup)` confirmaria cobertura total.

## 5. Feature Recommendation

### 5.1. Indexação de YAML/JSON para stories de infra

O HK.4 confirmou o que o create-story log já havia registrado: Memtrace é cego para `.github/workflows/*.yml`, `playwright.config.ts`, `package.json`. Indexar esses formatos como nós de grafo (`ConfigFile`, `CIJob`, `ScriptDefinition`) permitiria:
- `get_impact` para mudanças em scripts do package.json ("mudar `test:e2e` quebra a job `e2e-tests` no CI?")
- Rastreabilidade entre jobs do CI, scripts npm e seus arquivos de configuração
- `get_evolution` detectando mudanças em configs sem precisar de TS symbols

### 5.2. Process flow para grafos de execução não-TS

`get_process_flow` é limitado a cadeias de chamadas TypeScript. Um pipeline CI é também um grafo de execução (job → step → action). Indexar workflows do GitHub Actions como `ProcessNode` permitiria traçar: "step `db-migrate` alimenta `unit-tests` e `e2e-tests` — remover a dependência impacta 2 jobs downstream."

---

**Filed:** 2026-05-07

---

# Memtrace Session Log — Story HK.5 (Implementation + QA + CR)

**Epic:** epic-housekeeping
**Process:** implementação de story hk-5 + QA-Design (Murat) + QA-Verify (Murat) + Code Review 3-layer
**Session:** 2026-05-07 — Gate de QA Automatizado, dual-entry Murat, CI qa-gate job, JUnit parser
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `76b7ae3` (merged → `916b7a7`)

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Onboarding | `list_indexed_repositories` | Verify repo indexed — 0 nodes (reset needed) |
| Onboarding | `index_directory(incremental, skip_embed)` | Reindex after changes: 2956 nodes, 8703 edges, 1207 symbols, 3 API endpoints |
| Post-commit | `get_evolution(compound)` | Detect unintended changes after commit |
| Post-commit | `get_evolution(compound, narrower window)` | Confirm 3 episodes (reindex + working_tree + commit), no scope creep |
| Post-commit | `find_dead_code` (2×) | Verify no new dead symbols from HK.5 changes (all 15 results were pre-existing) |

**Memtrace calls prescribed but skipped:**
- `get_codebase_briefing` — not called at activation (hk.5 is infra/docs story, briefing adds less value for YAML/JSON/config targets)
- `find_code` — not called for existing JUnit XML parsing patterns (project has no existing XML utilities in JS)
- `get_changes_since` — not called (recent CI changes already known from HK.4 context)
- `get_impact` on any target — not applicable (all hk.5 targets are infra files: ci.yml, package.json, vitest.config.ts, templates — none are TS symbols)

---

## 2. Counterfactual Analysis

- **Post-impl safety**: `get_evolution` confirmed 3 episodes with 1209 nodes — all top changed files were pre-existing project code (actions.test.ts, evaluate-conflict.ts, components). No HK.5 files appeared in top-10, confirming zero unintended changes. Without this, would need manual diff review across 15 files.
- **Dead code verification**: `find_dead_code` returned 15 pre-existing symbols (Next.js route handlers, shadcn components, justifications helpers). All confirmed unrelated to HK.5. Without Memtrace, no systematic way to verify.
- **CI pipeline + YAML/JSON targets**: Like HK.4, the primary analysis effort (~70%) was direct file reading (`ci.yml`, `package.json`, `vitest.config.ts`, templates) + domain knowledge. Memtrace contributed post-impl safety checks.
- **Code review prompts**: 3-layer Gemini review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) used raw diffs, not Memtrace graph data. The JUnit parser bug (only first `<testsuite>`) was caught by Gemini, not Memtrace — MJS files are outside the AST index.
- **JUnit parser development**: The `scripts/qa-gate.mjs` (151 lines, ESM) has 5 internal functions (`parseJUnit`, `generateReport`, `countChildFailures`, `attrValue`, `evaluateGate`). Memtrace did not index these (`.mjs` in `/scripts` directory) — dead-code detection could not verify internal call graph.

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Post-commit regression detection | `get_evolution` — 1 call, 0 unintended changes | Manual diff-by-diff review across 15 files |
| Dead code confidence | `find_dead_code` — 0 new dead symbols verified | Optimism bias — "probably fine" |
| Repo reindex after commit | 1 call (`index_directory`, 5.7s) | Would need manual count or script |
| Code review context | Pre-populated prompts with full diff + ACs | Same — Gemini prompts used raw diffs |
| QA analysis (Murat) | 0 Memtrace calls in QA phases | Same — ATDD + test-design + review + trace all use internal templates |

**Note for infra/docs stories (HK.5):** ~70% of analysis effort was file reading + domain knowledge (QA workflows, CI patterns, JUnit XML format, BMad skill structure). Memtrace contributed ~30% (post-impl checks + brief onboarding). This matches the HK.4 pattern — Memtrace value is highest for stories with runtime TS code changes (HK.1, HK.2) where `get_impact`, `get_symbol_context`, `get_process_flow` provide graph-backed intelligence.

---

## 4. Usage Optimization

### 4.1. `get_codebase_briefing` pulado na ativação

Mesmo para uma story de infra/docs como HK.5, `get_codebase_briefing` teria fornecido o baseline: 1207 symbols, 3 API endpoints, 5 high-risk functions. Isso daria contexto para saber quantos testes existem (422+ baseline threshold) antes de escrever o script `qa-gate.mjs`. **Insight**: chamar `get_codebase_briefing(summary)` em TODAS as sessões, não só stories de runtime.

### 4.2. `get_changes_since` não chamado para contexto temporal

HK.4 alterou o CI pipeline na sessão anterior (`c5c2882`). `get_changes_since(since='2026-05-07T00:00:00Z')` teria revelado exatamente o que mudou no `ci.yml` — útil para saber onde inserir o job `qa-gate` sem precisar reler o arquivo inteiro. **Insight**: sempre parear `get_changes_since` com o primeiro `Read` do arquivo target.

### 4.3. `find_code` não usado para busca de padrões XML/JUnit

Antes de escrever `parseJUnit` regex-based, `find_code("junit" OR "xml" OR "parse" OR "fast-xml")` teria verificado se o projeto já tinha alguma dependência de parsing XML. Não teria encontrado nada (projeto não tem `fast-xml-parser`), mas teria confirmado a ausência com 1 call em vez de 0. **Insight**: para scripts novos, buscar padrões existentes antes de implementar — mesmo que o resultado seja "nada encontrado".

### 4.4. `get_impact` chamado zero vezes — justificado

Diferente das sessões HK.1/HK.2 (onde `get_impact` era chamado antes de cada edit), HK.5 não tocou em nenhum símbolo TS. Arquivos modificados foram YAML (ci.yml), JSON (package.json), TS-config (vitest.config.ts), MD (templates, docs), MJS (qa-gate.mjs). Nenhum destes é indexado como símbolo no grafo — `get_impact` retornaria vazio. **Insight**: o customization `activation_steps_prepend` prescreve `get_impact` antes de cada edit — isso deve ser condicionado ao tipo de arquivo. Se o target é non-TS, pular.

### 4.5. Prep steps do ATDD não aplicáveis por tipo de story

O skill `bmad-testarch-atdd` prescreve `get_process_flow`, `get_symbol_context`, `get_impact`, `find_api_endpoints` como prep steps. Para HK.5, nenhum destes faz sentido (não há feature flow, não há runtime symbols, não há API endpoints). O ATDD foi executado mesmo assim, gerando scaffolds de validação de documentação (file-content assertions) — úteis, mas sem os prep steps do Memtrace. **Insight**: o customization do ATDD deve detectar se a story é infra/docs e oferecer um caminho alternativo de prep steps (ex: `find_code` nos arquivos de config target, `get_changes_since` para o CI pipeline).

---

## 5. Feature Recommendation

### 5.1. Indexação de `.mjs` em `/scripts`

Memtrace indexou 190 arquivos e 1207 symbols, mas `scripts/qa-gate.mjs` (151 linhas, 5 funções) não aparece em `find_dead_code` — as funções internas (`parseJUnit`, `generateReport`, `countChildFailures`, `evaluateGate`, `attrValue`) não estão no grafo. Se Memtrace indexasse `.mjs` (que é JavaScript com extensão diferente), o código de script seria visível:
- `find_dead_code` poderia detectar funções internas não utilizadas
- `get_impact` poderia mostrar que `generateReport` → `parseJUnit` (dependência interna)
- `find_code("parseJUnit")` encontraria o script diretamente

Isso é tecnicamente viável (Tree-sitter já suporta JavaScript) e requer mudanças no Memtrace (extensão de arquivo `.mjs` nos padrões de scan).

### 5.2. Episódio `external_review` para code review do Gemini

Os 3 prompts de code review foram gerados aqui e executados no Gemini. Os resultados voltaram como arquivos `*-report.md` no disco, mas não como episódios na timeline do Memtrace. Se `record_external_episode(source_type='external_review')` fosse chamado com os findings no campo `metadata`, o code review apareceria em `get_evolution` junto com os commits de implementação — criando uma timeline completa: "story created → implemented → reviewed (Gemini findings) → fixed → merged".

---

**Filed:** 2026-05-07

---

# Memtrace Session Log — Story HK.6 (Create)

**Epic:** epic-housekeeping
**Process:** criação de story hk-6 (create-story workflow)
**Session:** 2026-05-08 — Migrar Tracking de Débito para GitHub Issues
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `c28b3de`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Activation (prepend) | `get_codebase_briefing(summary)` | Repo scale (1207 symbols, 5 modules, 80 dead-code candidates) |

**Skipped (prescribed by customization but not applicable):**
- `get_symbol_context` — no TS symbol target (hk.6 creates YAML index + MJS script + markdown story)
- `get_impact` — no runtime code to trace
- `find_dependency_path` — no code dependencies between hk.6 and hk.5
- `get_process_flow` — no execution flow to trace for process/infra story

---

## 2. Counterfactual Analysis

- **Story creation**: Without Memtrace, the same `Read` + `grep` + `gh` workflow would have been used — epics file, retrospective, story files, GitHub labels — none of which are in the AST graph
- **D15-D18 reconstruction**: Required reading `epic-3-retro-2026-05-05.md` + 3 story files from Epic 3 (`3-3`, `3-4`, `deferred-work.md`) — `find_code` cannot retroactively recover data that wasn't written down
- **Octokit version research**: Used web search (Exa/Google), not Memtrace — Memtrace doesn't track npm package versions
- **GitHub labels audit**: Used `gh label list` — no Memtrace equivalent for GitHub metadata

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Repo scale awareness | 1 call (`get_codebase_briefing`) | Manual directory traversal |
| File analysis | Via `Read` (not Memtrace) | Same — YAML/MD target files not indexed |
| Tech debt inventory | Manual extraction from retrospective markdown | Same — no Memtrace value for unstructured text |

**Note:** This story targets markdown (story file, deferred-work.md), YAML (tech-debt.yaml), MJS (script), and JSON (package.json). Memtrace's value was limited to the codebase briefing — consistent with the infra/docs pattern observed in HK.4 and HK.5 where ~70% of analysis is file reading + domain knowledge, and Memtrace contributes ~30%.

---

## 4. Usage Optimization

### 4.1. `get_codebase_briefing` chamado corretamente

Diferente das sessões HK.4 e HK.5 (onde o briefing foi pulado na ativação), `get_codebase_briefing(summary)` foi executado como prep step. Forneceu baseline: 1207 symbols, 5 módulos, 80 dead-code candidates.

### 4.2. `record_external_episode` não chamado

O story file foi criado e commitado, mas não registrado como `agent_intent` no Memtrace via `record_external_episode`. Conforme recomendado no log HK.2 (Create) seção 5.2, registrar story creation como episódio faria a criação aparecer em `get_evolution` — downstream agents veriam "hk-6 created at T, implemented at T+1".

---

## 5. Feature Recommendation

Nenhuma nova. Todos os gaps identificados nesta sessão (infra/documentation blind spot, `.mjs` non-indexing, story creation as episode) já foram registrados em sessões anteriores (HK.4 Create 5.1, HK.5 Implementation 5.1, HK.2 Create 5.2).

---

# Memtrace Session Log — Story HK.6 (Implementation + Code Review)

**Epic:** epic-housekeeping
**Process:** implementação de story hk-6 — Migrar Tracking de Débito para GitHub Issues + Code Review adversarial + Murat QA
**Session:** 2026-05-08 — YAML index, Octokit script, GitHub Issues creation, code review patches, lint fix
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `593e0cd` `7b82447` `cb2dff6` `89ebdde`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Pre-dev (activation) | `get_codebase_briefing(summary)` | Repo scale (1207 symbols, 5 modules, 80 dead-code) — `activation_steps_prepend` |
| Pre-dev (activation) | `find_code` (create-tech-debt, Octokit) | Search for existing Octokit patterns — found only in `my-bmad/`, not project |
| Index check | `list_indexed_repositories` | Discovered 3 indexed repos, but main had 0 nodes (stale index) |
| Index repair | `index_directory(incremental)` | Failed with Windows file lock (os error 1224) |
| Index repair | `delete_repository` + re-index | Failed — DB corruption. Waited for user restart |
| Post-restart | `get_repository_stats` | Confirmed index updated: 3232 nodes, 9828 edges, 832 episodes |
| Post-restart | `get_codebase_briefing(summary)` | Updated scale: 1065 functions, 709 communities (+371) |
| Post-restart | `get_changes_since` | Now sees hk-6 commits in timeline |
| Post-restart | `get_evolution(compound)` | 32 episodes, 3485 nodes added, 10053 edges added (full history replay) |
| Post-restart | `find_symbol(parseYaml)` | Found at `scripts/create-tech-debt-issues.mjs:39` — .mjs now indexed |
| Post-restart | `find_central_symbols(top=15)` | load-bearing: `cn` (70), `Button` (748), `DayDetailSheet` |
| Post-restart | `find_bridge_symbols(limit=10)` | DayDetailSheet betweenness 1641 — highest chokepoint |
| Post-restart | `find_dead_code(limit=15)` | 15 pre-existing dead symbols (justifications, shadcn, handler) |
| Watcher setup | `watch_directory` | Activated watcher on main (200ms debounce) |
| Watcher verify | `list_watched_paths` | Confirmed 1 active watch |

**Skipped (prescribed but not applicable):**
- `get_impact` / `get_symbol_context` — no runtime TS symbols modified
- `get_process_flow` — no execution flow to trace for infra/process story
- `find_dependency_path` — no code dependencies

---

## 2. Counterfactual Analysis

- **Post-impl regression detection**: `get_evolution` confirmed all changes infra-only — zero runtime symbols touched. Without Memtrace, manual diff review across 8 files.
- **Dead code verification**: `find_dead_code` returned 15 pre-existing dead symbols — none from HK.6.
- **Watcher diagnosis**: Without `list_watched_paths`, wouldn't have known the watcher was missing after restart.
- **Bridge symbol awareness**: `DayDetailSheet` with 1641 betweenness confirms HK.1 was justified — context for Epic 4.
- **Code review prompts**: 4 external agents ran on Gemini — no Memtrace graph data embedded in prompts.

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Post-commit verification | `get_evolution` — 0 runtime changes | Manual diff review across 8 files |
| Dead code confidence | `find_dead_code` — 0 new dead symbols | Optimism bias |
| Watcher state diagnosis | `list_watched_paths` — found missing immediately | Would only notice at next commit |
| Bridge symbol awareness | `find_bridge_symbols` — DayDetailSheet = 1641 | Would not know inter-community risk |
| Runtime impact confirmation | `get_evolution` — 0 nodes in src/ | Manual inspection |
| Script existence | `find_symbol(parseYaml)` found .mjs after reindex | .mjs invisible before reindex |

---

## 4. Usage Optimization

### 4.1. Activation prepends não deviam ser pulados para infra stories

Inicialmente pulei `get_codebase_briefing`, `find_code`, `get_changes_since` porque "HK.6 é infra". O briefing e `find_code` são úteis mesmo para infra: revelam 422+ testes (baseline), mostram padrões existentes (`my-bmad` GitHub client). **Insight**: rodar OS 3 prepends em TODAS as sessões — custo baixo e diagnóstico precoce.

### 4.2. `find_dead_code` só rodou após restart do cliente

Índice congelado (0 nós em main). `find_dead_code` não foi chamado antes porque retornaria vazio. **Insight**: após qualquer `index_directory`, confirmar com `get_repository_stats` que `total_nodes > 0` e `last_episode` está no branch correto antes de chamar `find_dead_code`.

### 4.3. `get_evolution` devia ser par obrigatório pós-reindex

Após restart, rodei `list_watched_paths` e stats, mas demorei a rodar `get_evolution(compound)` — que é o diagnóstico mais rico. **Insight**: `get_repository_stats` + `get_evolution(compound)` como par obrigatório após qualquer reindex.

### 4.4. Dados do grafo não embedados nos prompts de code review

Assim como HK.5, os 4 prompts não incluíram `get_impact` ou `get_symbol_context`. O Acceptance Auditor teria se beneficiado de saber que `parseYaml` tem zero callers externos. **Insight**: incluir evidência de grafo em prompts autossuficientes — mesmo para revisores externos sem acesso ao Memtrace.

### 4.5. Watcher perdido após restart do cliente

`watch_directory` ativou, mas o wather morre na desconexão MCP. **Insight**: adicionar verificação de watcher como activation prepend — se count === 0, ativar automaticamente.

---

## 5. Feature Recommendation

### 5.1. Indexação de `.mjs` em scripts/ (reiterado HK.5)

`parseYaml` só apareceu após reindex completo. Tree-sitter JS reconhece `.mjs`, mas scan path exclui `scripts/`. **Solução**: configurar scan paths ou extensões.

### 5.2. Persistência de watchers entre sessões

Watcher morre na desconexão MCP. Se o server salvasse `watches.json` em disco, o watch seria restaurado automaticamente na reconexão.

---

**Filed:** 2026-05-08
