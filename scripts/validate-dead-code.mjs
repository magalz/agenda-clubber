#!/usr/bin/env node

/**
 * validate-dead-code.mjs
 *
 * Wrapper around Memtrace find_dead_code that validates each candidate
 * against the actual codebase and a known pitfalls catalog.
 *
 * Cross-references each dead-code candidate with:
 *   1. grep — does the symbol exist in current source code?
 *   2. memtrace-pitfalls.md — is it a known false-positive pattern?
 *
 * Outputs a table with confidence levels:
 *   GHOST     — symbol not found on disk (Memtrace historical safety net)
 *   FALSE_POS — matches a known false-positive pattern
 *   SUSPECT   — found in source but not referenced (likely dead)
 *
 * Note: GHOST and \\?\\ path duplication are no longer Memtrace bugs
 * (fixed upstream in v0.3.90+). GHOST kept as safety net.
 *
 * Usage:
 *   node scripts/validate-dead-code.mjs          # uses find_dead_code MCP output
 *   node scripts/validate-dead-code.mjs --file <json>  # from saved JSON
 *
 * Requires: find_dead_code to be available via the MCP tool.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');

/**
 * Pitfalls catalog — patterns known to produce false positives in Memtrace.
 * Keep this in sync with docs/memtrace-pitfalls.md.
 */
const PITFALLS = [
  // Framework entry points — invoked by runtime, not by code
  { pattern: /handler/i, name: 'Next.js route handler',
    reason: 'Framework entry point (Next.js API route invoked by runtime)' },
  { pattern: /^globalSetup$/i, name: 'Playwright globalSetup',
    reason: 'Framework entry point (Playwright config invokes it)' },

  // Dispatch via Record/Map — runtime lookup, not AST-detectable
  { pattern: /^build(GENRE|NonLocalArtist|LocalSaturation)Justification$/,
    name: 'Dispatch via Record lookup',
    reason: 'Called via BUILDERS[h.rule](h) Record dispatch in evaluate-conflict.ts' },

  // Function passed as value — reference edge, not call edge
  { pattern: /^CopyIcon$/i, name: 'useState(CopyIcon)',
    reason: 'Function passed as value to useState() — reference, not direct call' },

  // MSW handlers — registered via setup, not called by app code
  { pattern: /^GET https?:\/\//i, name: 'MSW HTTP handler',
    reason: 'MSW mock handler registered by setupServer/setupWorker' },
  { pattern: /^POST https?:\/\//i, name: 'MSW HTTP handler',
    reason: 'MSW mock handler registered by setupServer/setupWorker' },

  // Vitest mocks — reference-only, not called by app code
  { pattern: /^(observe|unobserve|disconnect)$/i,
    name: 'Vitest mock (IntersectionObserver)',
    reason: 'Mock implementation, referenced by vitest setup, not by app code' },
];

function run(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function grepExists(symbol) {
  // Search for the symbol name in source files only
  if (!symbol) return false;
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const result = run(`rg -l "${escaped}" src/ --type ts --type tsx 2>nul`);
  if (!result) return false;
  const files = result.split('\n').filter(Boolean);
  return files.length > 0;
}

function matchPitfall(name) {
  for (const p of PITFALLS) {
    if (p.pattern.test(name)) {
      return p;
    }
  }
  return null;
}

function classify(name) {
  // 1. Check pitfalls first
  const pitfall = matchPitfall(name);
  if (pitfall) {
    return { verdict: 'FALSE_POS', label: '⚠️ FALSE POSITIVE', reason: pitfall.reason };
  }

  // 2. Check if symbol exists on disk
  const exists = grepExists(name);
  if (!exists) {
    return { verdict: 'GHOST', label: '👻 GHOST', reason: 'Symbol not found in source code — Memtrace historical ghost' };
  }

  // 3. Found in source but unreferenced — likely dead
  return { verdict: 'SUSPECT', label: '🔍 SUSPECT', reason: 'Found in source, zero callers — review' };
}

function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DEAD CODE VALIDATOR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  Cross-referencing Memtrace candidates against codebase...');

  // In MCP env, the agent provides candidates directly.
  // For CLI usage, read from a saved JSON file.
  let input = null;
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = resolve(PROJECT_ROOT, args[fileIdx + 1]);
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    input = JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  if (!input) {
    // Agent mode: expect input piped through env var or use embedded mcp via subprocess
    console.log('');
    console.log('  Usage: pipe find_dead_code JSON or use --file <path>');
    console.log('');
    console.log('  Example workflow:');
    console.log('    1. Run mcp__memtrace__find_dead_code(repo_id="agenda-clubber")');
    console.log('    2. Save output to .claude/dead-code-candidates.json');
    console.log('    3. node scripts/validate-dead-code.mjs --file .claude/dead-code-candidates.json');
    console.log('');
    console.log('  In agent workflow, pass the MCP output directly to this script.');
    process.exit(1);
  }

  const candidates = Array.isArray(input) ? input : (input.results || input.candidates || []);

  if (candidates.length === 0) {
    console.log('  No candidates found — your codebase is clean!');
    process.exit(0);
  }

  // Deduplicate by name (path duplication bug causes duplicates)
  const seen = new Set();
  const unique = candidates.filter(c => {
    const key = c.name || c;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = unique.map(c => {
    const name = typeof c === 'string' ? c : c.name;
    const path = c.file_path || '';
    const line = c.start_line || '';
    const { verdict, label, reason } = classify(name);
    return { name, file: path, line, verdict, label, reason };
  });

  // Sort: suspects first, false positives & ghosts last
  results.sort((a, b) => {
    const order = { SUSPECT: 0, FALSE_POS: 1, GHOST: 2 };
    return (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9);
  });

  console.log('');
  console.log(`  ${results.length} candidates analyzed (${unique.length} unique)`);
  console.log('');

  const counters = { SUSPECT: 0, FALSE_POS: 0, GHOST: 0 };
  for (const r of results) {
    counters[r.verdict] = (counters[r.verdict] || 0) + 1;
    console.log(`  ${r.label.padEnd(30)} ${r.name.padEnd(40)} ${r.reason}`);
  }

  console.log('');
  console.log('── Summary ──────────────────────────────────────────');
  console.log(`  🔍 SUSPECT      ${counters.SUSPECT}  — Likely dead code (review recommended)`);
  console.log(`  ⚠️  FALSE_POS    ${counters.FALSE_POS}  — Known false positive (skip)`);
  console.log(`  👻 GHOST         ${counters.GHOST}  — Safety net (bug fixed upstream in v0.3.90+)`);
  console.log('');

  if (counters.SUSPECT > 0) {
    console.log('  🔧 Candidates to review:');
    for (const r of results) {
      if (r.verdict === 'SUSPECT') {
        console.log(`     ${r.name.padEnd(40)} ${r.file.replace(PROJECT_ROOT + '\\', '').replace(/\\\\?\\/, '')}:${r.line}`);
      }
    }
    console.log('');
  }
}

main();
