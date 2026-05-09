# Validate Dead Code — Validator Documentation

## Why This Validator Exists

Memtrace is an exceptional structural analysis tool, but `find_dead_code` has known limitations that produce false positives:

1. **Structural false positives**: Memtrace cannot detect dynamic dispatch via Record (runtime lookup), functions passed as values (reference vs. call edge), framework entry points (Next.js route handlers, Playwright globalSetup), MSW handlers, and Vitest mocks. These patterns are impossible to detect via static AST analysis alone.

2. **Historical ghost bug**: `find_dead_code` includes nodes from old commits where already-removed symbols still existed. This happens because git history replay (performed during indexing) creates nodes for every version of every symbol, and the query does not properly filter for the current HEAD state.

3. **Windows path duplication**: The `\\?\` prefix in Memtrace's internal file paths causes the same symbol to appear 2-3 times in results.

**Without this validator**, agents and developers waste time investigating ghosts or, worse, remove code that appears dead but is actually in use through runtime-undetectable patterns.

---

## How It Was Implemented

### Architecture

The validator is a Node.js script (`scripts/validate-dead-code.mjs`) that acts as a wrapper around Memtrace's `find_dead_code`:

```
Memtrace find_dead_code  →  JSON candidates  →  validate-dead-code.mjs  →  Classified table
```

### Script Steps

1. **Receive candidates**: The script accepts input in two ways:
   - MCP agent mode: passing `find_dead_code` output as JSON
   - CLI mode: `node scripts/validate-dead-code.mjs --file <path>.json`

2. **Deduplicate**: Removes duplicate entries caused by the Windows `\\?\` path bug, keeping one instance per symbol name.

3. **Classify each candidate** into 4 categories:

   | Category | Label | Meaning | Action |
   |----------|-------|---------|--------|
   | `GHOST` | 👻 | Symbol no longer exists in source code. It's a historical commit node Memtrace didn't filter. | Ignore — upstream bug |
   | `FALSE_POS` | ⚠️ | Known false-positive pattern (Record dispatch, function as value, framework entry point, MSW, Vitest mock) | Ignore — known limitation |
   | `SUSPECT` | 🔍 | Symbol exists in source but zero callers detected. Likely actually dead. | Review manually |
   | `CONFIRMED` | ✅ | Verified dead across multiple checks. | Safe to remove |

4. **Cross-reference with grep**: For each candidate, runs `rg -l <symbol> src/` to verify the symbol exists in the current code. If not found, classifies as `GHOST`.

5. **Cross-reference with pitfalls catalog**: Each candidate is matched against regex patterns from `docs/memtrace-pitfalls.md`. If matched, classifies as `FALSE_POS` with the documented reason.

### Dependencies

- **Node.js** (>= 18, supports `import.meta.dirname`)
- **ripgrep** (`rg`) — for fast source file searching
- Memtrace `find_dead_code` output

---

## How to Implement (Guide for Other Windows Users)

This guide explains how to create your own dead code validator if you use Memtrace on Windows and encounter the same false positives.

### Prerequisites

- Node.js 18+ installed
- Memtrace configured and indexing your repository
- ripgrep (or Git Bash grep) available in PATH

### Step 1: Create the Script

```javascript
// scripts/validate-dead-code.mjs
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const PROJECT_ROOT = process.cwd();

// 1a: Define your pitfalls catalog
const PITFALLS = [
  // Dynamic dispatch via Record/Map
  { pattern: /dispatchByType|executeRule/, name: 'Record dispatch',
    reason: 'Called via Record lookup — runtime, not AST' },
  // Framework entry points
  { pattern: /^handler$/i, name: 'Next.js route handler',
    reason: 'Next.js entry point — invoked by runtime' },
  // MSW handlers
  { pattern: /^(GET|POST|PUT|DELETE) https?:\/\//i, name: 'MSW handler',
    reason: 'Handlers registered in MSW setup code' },
  // Vitest mocks
  { pattern: /^(observe|unobserve|disconnect)$/i, name: 'Vitest mock',
    reason: 'IntersectionObserver mock' },
];

// 1b: Classification function
function classify(name) {
  for (const p of PITFALLS) {
    if (p.pattern.test(name)) return { verdict: 'FALSE_POS', reason: p.reason };
  }
  // Check disk existence
  try {
    const result = execSync(`rg -l "${name}" src/`, { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim() ? { verdict: 'SUSPECT', reason: 'Exists in code but zero callers' }
                         : { verdict: 'GHOST', reason: 'Not found in source code' };
  } catch {
    return { verdict: 'GHOST', reason: 'Not found in source code' };
  }
}

// 1c: Process candidates
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

### Step 2: Add to package.json (optional)

```json
"validate:dead-code": "node scripts/validate-dead-code.mjs"
```

### Step 3: Run in Your Workflow

```powershell
# 1. Run find_dead_code via MCP and save the output
# 2. Pipe it to the validator
node scripts/validate-dead-code.mjs --file .claude/dead-code-candidates.json
```

### Customizing the Pitfalls Catalog

For your project, edit the `PITFALLS` array to include:

- **Framework entry points**: Next.js (`handler` in route.ts), Nuxt, SvelteKit, Express middleware, etc.
- **MSW handlers**: Any HTTP handlers mocked via MSW
- **Dependency injection**: If using DI containers (NestJS, Angular), functions registered as providers
- **Reflection/Decorators**: Methods invoked via decorator or reflection

To identify new patterns in your project:

1. List candidates from `find_dead_code`
2. For each suspicious candidate, grep the code for references
3. If the symbol exists and is used (via runtime pattern), add to the catalog
4. Re-run the validator — it will now classify correctly

### Avoiding Live Code Removal

Always follow this flow before removing any candidate:

1. **Run the validator** → filter to only `SUSPECT`
2. **For each SUSPECT**, manually verify:
   - Does the symbol export something? It may be used by a non-indexed module
   - Is it a template/layout/test fixture referenced by the framework?
   - Is it a callback registered during setup?
3. **Only remove if 100% certain**

### Common Windows Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `rg` not found | ripgrep not in PATH | Install via `winget install BurntSushi.ripgrep.MSVC` |
| `\\?\` path prefix invalid | Memtrace returns prefixed paths | Handled by name-based deduplication |
| Node.js ESM not recognized | Old Node version | Use Node 18+ or add `"type": "module"` to package.json |

---

## References

- Pitfalls catalog: `docs/memtrace-pitfalls.md`
- Validator script: `scripts/validate-dead-code.mjs`
- Upstream bug report: `docs/memtrace-bug-reports-discord.md` (Bug #2 — find_dead_code returns historical symbols)
- Design session in retro: `epic-housekeeping-retro-2026-05-08.md` (Section 4 - Memtrace)
