# Session Analysis Protocol - Memtrace

**Scope Instruction:** Analyze only the actions and data generated within the current session (present execution context). Include interactions from other agents only if they occurred within this specific flow. Do not evaluate historical data from previous sessions.

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
  epic: "[epic tag — e.g. epic-housekeeping, epic-3]"
  process: "[process tag — e.g. criaçao de epico, criaçao de story x-x, implementaçao de story hk-1, revisao pos-dev, etc.]"
  date: "[YYYY-MM-DD]"
  agent: "[model name]"
  commits: "[sha1] [sha2] ..."
```

---

# Memtrace Session Log — Story HK.1

**Epic:** epic-housekeeping
**Process:** implementação de story hk-1
**Session:** 2026-05-06 · Refactor DayDetailSheet and updateEvent
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** `9f75341` `0ef7f98` `87fe22a`

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Pre-dev | `get_codebase_briefing` | Discover repo scale, modules, high-risk symbols before writing anything |
| Pre-dev | `find_code` (calendar-related) | Locate exact symbol positions without grepping |
| Pre-dev | `get_changes_since` | See what was touched recently in the same files |
| Before each edit | `get_impact(updateEvent)` | Blast-radius check: LOW risk → safe to refactor |
| Before each edit | `get_impact(DayDetailSheet)` | Same check for the component |
| Post-impl | `get_evolution` | Detect unintended changes outside story scope |
| Post-impl | `find_dead_code` | Ensure no new symbol was introduced without a caller |
| Code review prep | `find_most_complex_functions` | Validate complexity reduction targets |
| After final commit | `index_directory(incremental)` | Reindex the graph after all changes landed |

---

## 2. Counterfactual Analysis

- **Onboarding**: Read 10–15 files manually to understand architecture before touching anything
- **Refactoring risk**: Manual grep for imports of `DayDetailSheet` and `updateEvent` — easy to miss a consumer
- **Dead code**: No systematic way to catch orphaned symbols; would only surface at runtime or never
- **Complexity validation**: Would need a linter rule or manual review; no pre/post comparison
- **Post-commit safety**: No way to detect scope creep / unintended changes without reading every diff manually
- **Code review**: Each layer would require manual searching; no graph evidence to back findings

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to understand the target area | 2 calls (`briefing` + `find_code`) | Reading 10+ files, cross-referencing imports |
| Confidence to refactor monolithic functions | `get_impact → LOW` eliminated fear | "Hope it doesn't break" |
| Dead symbols caught | 0 new dead symbols (verified) | Unknown — optimism bias |
| Scope creep detected | `get_evolution` after each commit | Manual diff review, easy to miss |
| Code review evidence | Graph-backed triage (MUST-FIX, SHOULD-FIX) | Subjective opinion |
| File lock issue on Windows | Cost ~5 min to diagnose + workaround | Doesn't apply |

---

## 4. Feature Recommendation

### 4.1. Before the first edit — deeper blast radius

I called `get_impact` before editing `updateEvent` and `DayDetailSheet`, but I didn't call `get_symbol_context` on the inline functions (`renderEvent`, `isOwnEvent`) before removing them. **Insight**: when deleting code, call `find_symbol` on every deleted function to rule out external references (even when they look internal).

### 4.2. For test coverage mapping

`list_processes` + `get_process_flow` would have helped identify which execution flows lack test coverage before writing new tests. Instead, I discovered gaps only during the QA audit. **Insight**: run `list_processes` as a test‑planning step, not a post‑mortem.

### 4.3. Bridge-symbol check for extracted helpers

When I moved `authorizeAndFetchEvent`, `buildUpdateData`, `recomputeConflicts` to `helpers.ts`, I should have run `find_bridge_symbols` on the new file. If any of those helpers become widely imported, they become chokepoints. **Insight**: run bridge check on new shared modules early, not after they accumulate callers.

### 4.4. Auto‑index on commit

The manual `replay_history` → `index_directory` dance after every commit is friction. If `watch_directory` also watched `.git/refs/heads/*` and triggered the indexing chain on commit, the post‑commit `get_evolution` and `find_dead_code` checks would be instant. This was requested as a feature.

### 4.5. Windows file‑lock handling

`index_directory` fails when `watch_directory` holds an ArcadeDB handle. Workaround: `unwatch` → `index` → `watch`. A proper fix (retry with backoff, or auto‑detach the mapped section) would remove the friction entirely. Bug report filed with Memtrace team.

---

### 5. What is a good feature Memtrace could have to help me better?

---

# Memtrace Session Log — Story HK.2 (Create)

**Epic:** epic-housekeeping
**Process:** criação de story hk-2
**Session:** 2026-05-06 · Create Story HK.2 — RLS divergence + race condition
**Agent:** opencode-go/deepseek-v4-flash
**Commits:** (story file created, not yet committed)

---

## 1. Memtrace Utilization

| Phase | Tool Call | Purpose |
|-------|-----------|---------|
| Prep (customization) | `get_codebase_briefing` | Briefing loaded via activation_steps_prepend — repo scale, modules, 585 symbols |
| Prep (customization) | `find_symbol(fetchCrossCollectiveEvents)` | Caller/callee map for the race-condition target (D5) |
| Prep (customization) | `find_symbol(filterEventForViewer)` | Caller map for the RLS divergence target (D3) |
| Prep (customization) | `get_symbol_context(useCrossCollectiveEvents)` | Full 360° view: callers (CalendarGridClient), callees (fetchCrossCollectiveEvents), process membership |
| Prep (customization) | `get_impact(filterEventForViewer)` | Blast-radius: LOW — RLS fix touches only SQL, not app-layer |
| Pre-write | Explore subagent | Discovered 21 files via grep/glob/read — RLS SQL, visibility.ts, hooks.ts, store.ts, events-queries.ts, types.ts, tests |

**Note:** The `activation_steps_prepend` customization configured Memtrace tools for story creation, but the heavy code discovery was delegated to the explore subagent (grep/glob), not direct Memtrace calls. The subagent returned complete file contents for all 21 relevant files.

---

## 2. Counterfactual Analysis

- **Scope definition**: Without Memtrace's `get_impact`, would not have known `filterEventForViewer` has zero blast radius (RISK LOW, 0 affected files) — confidence to leave it untouched
- **Symbol discovery**: Manual grep for `events_select_policy` would have found the SQL file but Memtrace's `find_symbol` confirmed `filterEventForViewer` is isolated — no need to touch visibility.ts
- **Race condition analysis**: `get_symbol_context(useCrossCollectiveEvents)` revealed the exact inline code still has `setCrossEvents(result)` in `queryFn` (confirmed by indexed graph)
- **Process membership**: `useCrossCollectiveEvents` belongs to `CollectiveDashboardPageProcess` at step 13 — useful for understanding where in the render cycle the fix sits

---

## 3. Measurable Gains

| Metric | With Memtrace | Without (estimate) |
|--------|---------------|-------------------|
| Time to verify filterEventForViewer is safe to leave alone | 1 call (`get_impact → LOW`) | Manual review of 32-line function + cross-reference callers |
| Confidence in RLS-only scope | `get_impact = 0 affected files` | "Hope it doesn't affect visibility.ts" |
| Understanding race condition location | `get_symbol_context` showed exact code inline | Read hooks.ts manually |
| Story file quality | 21 file contents from subagent + Memtrace metrics → precise dev notes | Surface-level from epic only |

---

## 4. Usage Optimization

- **Use Memtrace FIRST, not subagent**: The explore subagent used grep/glob/read instead of Memtrace `find_code`/`find_symbol`, which would have been faster and more precise. Next time: call Memtrace tools directly before delegating to a subagent.
- **`get_evolution` post story creation**: Not called after writing the story file — would catch if any unintended artifacts were modified. Add as a checklist step.
- **`find_dead_code` for SQL migrations**: Not applicable since no new TS symbols were introduced, but worth noting for future stories that create Server Actions.

---

## 5. Feature Recommendation

### 5.1. SQL/RLS-aware symbol search

Memtrace currently indexes only source-code symbols (TypeScript, Rust, etc.). RLS policies defined in `.sql` migration files are opaque to the graph. A feature to index PostgreSQL policy definitions (`CREATE POLICY ... ON ... FOR SELECT USING (...)`) as graph nodes would enable:
- Tracing which tables have RLS and which roles they affect
- `get_impact` for SQL migrations showing affected queries
- Cross-reference between app-layer visibility functions and their RLS counterparts

### 5.2. Story creation as an indexed episode

When `create-story` produces a story file, registering it as an `agent_intent` episode (via `record_external_episode`) would make the story creation appear in `get_evolution` timelines — so downstream agents can see "story hk-2 was created at T, then implemented at T+1".

---

**Filed:** 2026-05-06
