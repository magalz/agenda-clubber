#!/usr/bin/env node

/**
 * qa-memtrace.mjs
 *
 * Gate de qualidade Memtrace para o fluxo de desenvolvimento.
 * Processa candidatos de dead code gerados pelo MCP find_dead_code
 * e produz um report estruturado.
 *
 * Uso pelo agente:
 *   1. mcp__memtrace__find_dead_code(repo_id="agenda-clubber")
 *      → salvar output em .claude/dead-code-candidates.json
 *   2. node scripts/qa-memtrace.mjs
 *      → lê .claude/dead-code-candidates.json, valida, gera report
 *
 * Uso direto:
 *   node scripts/qa-memtrace.mjs --file <caminho>
 *
 * Exit codes:
 *   0 — aprovado (sem SUSPECTs ou todos revisados)
 *   1 — SUSPECTs encontrados (requer revisão manual)
 *   2 — erro de execução
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(PROJECT_ROOT, '.claude');
const DEFAULT_CANDIDATES = resolve(OUTPUT_DIR, 'dead-code-candidates.json');
const REPORT_FILE = resolve(OUTPUT_DIR, 'qa-memtrace-report.md');

const PITFALLS = [
  { pattern: /handler/i, name: 'Next.js route handler',
    reason: 'Framework entry point (Next.js API route invoked by runtime)' },
  { pattern: /^globalSetup$/i, name: 'Playwright globalSetup',
    reason: 'Framework entry point (Playwright config invokes it)' },
  { pattern: /^build(GENRE|NonLocalArtist|LocalSaturation)Justification$/,
    name: 'Dispatch via Record lookup',
    reason: 'Called via BUILDERS[h.rule](h) Record dispatch' },
  { pattern: /^CopyIcon$/i, name: 'useState(CopyIcon)',
    reason: 'Function passed as value to useState()' },
  { pattern: /^GET https?:\/\//i, name: 'MSW HTTP handler',
    reason: 'MSW mock handler registered by setupServer/setupWorker' },
  { pattern: /^POST https?:\/\//i, name: 'MSW HTTP handler',
    reason: 'MSW mock handler registered by setupServer/setupWorker' },
  { pattern: /^(observe|unobserve|disconnect)$/i,
    name: 'Vitest mock (IntersectionObserver)',
    reason: 'Mock implementation referenced by vitest setup' },
];

function run(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function grepExists(symbol) {
  if (!symbol) return false;
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const result = run(`rg -l "${escaped}" src/ --type ts --type tsx 2>nul`);
  if (!result) return false;
  return result.split('\n').filter(Boolean).length > 0;
}

function matchPitfall(name) {
  for (const p of PITFALLS) {
    if (p.pattern.test(name)) return p;
  }
  return null;
}

function classify(name) {
  const pitfall = matchPitfall(name);
  if (pitfall) return { verdict: 'FALSE_POS', label: 'FALSE POSITIVE', reason: pitfall.reason };
  const exists = grepExists(name);
  if (!exists) return { verdict: 'GHOST', label: 'GHOST', reason: 'Symbol not found in source — safety net' };
  return { verdict: 'SUSPECT', label: 'SUSPECT', reason: 'Found in source, zero callers — review' };
}

function statusSymbol(status) {
  const icons = { SUSPECT: '🔍', FALSE_POS: '⚠️', GHOST: '👻' };
  return icons[status] || '❓';
}

function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const candidatesPath = fileIdx !== -1 ? resolve(PROJECT_ROOT, args[fileIdx + 1]) : DEFAULT_CANDIDATES;

  if (!existsSync(candidatesPath)) {
    console.error(`❌ Candidates file not found: ${candidatesPath}`);
    console.error('');
    console.error('  Expected workflow:');
    console.error('    1. mcp__memtrace__find_dead_code(repo_id="agenda-clubber")');
    console.error('    2. Save output to .claude/dead-code-candidates.json');
    console.error(`    3. node scripts/qa-memtrace.mjs`);
    process.exit(2);
  }

  let input;
  try {
    input = JSON.parse(readFileSync(candidatesPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to parse candidates file: ${e.message}`);
    process.exit(2);
  }

  const candidates = Array.isArray(input) ? input : (input.results || input.candidates || []);

  const seen = new Set();
  const unique = candidates.filter(c => {
    const key = c.name || c;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = unique.map(c => {
    const name = typeof c === 'string' ? c : c.name;
    const filePath = c.file_path || '';
    const line = c.start_line || '';
    const { verdict, label, reason } = classify(name);
    return { name, file: filePath, line, verdict, label, reason };
  });

  results.sort((a, b) => {
    const order = { SUSPECT: 0, FALSE_POS: 1, GHOST: 2 };
    return (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9);
  });

  const counters = { SUSPECT: 0, FALSE_POS: 0, GHOST: 0 };
  for (const r of results) counters[r.verdict]++;

  // Generate markdown report
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let report = `# QA Memtrace Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Candidates:** ${results.length} (${unique.length} unique)\n\n`;
  report += `| Verdict | Count |\n|---------|-------|\n`;
  report += `| 🔍 SUSPECT | ${counters.SUSPECT} |\n`;
  report += `| ⚠️ FALSE_POS | ${counters.FALSE_POS} |\n`;
  report += `| 👻 GHOST | ${counters.GHOST} |\n\n`;

  if (counters.SUSPECT === 0) {
    report += `## ✅ Result: PASS\n\nNo dead code suspects found.\n`;
  } else {
    report += `## ❌ Result: FAIL — ${counters.SUSPECT} SUSPECT(s) require review\n\n`;
    report += `| Symbol | File | Reason |\n|--------|------|-------|\n`;
    for (const r of results) {
      if (r.verdict === 'SUSPECT') {
        const shortFile = r.file.replace(PROJECT_ROOT + '\\', '').replace(/\\\\?\\/, '');
        report += `| ${statusSymbol(r.verdict)} \`${r.name}\` | \`${shortFile}:${r.line}\` | ${r.reason} |\n`;
      }
    }
    report += `\n## Resolution\n\n`;
    report += `Before proceeding, review each SUSPECT:\n`;
    report += `1. Verify the symbol is truly unused (check exports, templates, callbacks)\n`;
    report += `2. If safe: remove the symbol\n`;
    report += `3. If not safe: add to pitfalls catalog in \`docs/memtrace-pitfalls.md\`\n`;
    report += `4. Re-run \`npm run qa:memtrace\` to confirm\n`;
  }

  report += `\n---\n### Notes\n`;
  report += `- FALSE_POS = known Memtrace false-positive (safe to ignore)\n`;
  report += `- GHOST = symbol not on disk (residual safety net, bug fixed in v0.3.90+)\n`;

  writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`📄 Report saved: ${REPORT_FILE}`);
  console.log('');
  console.log(report);

  // Console summary
  console.log('── Summary ──────────────────────────────────────────');
  console.log(`  🔍 SUSPECT      ${counters.SUSPECT}  — Likely dead code (review required)`);
  console.log(`  ⚠️  FALSE_POS    ${counters.FALSE_POS}  — Known false positive (skip)`);
  console.log(`  👻 GHOST         ${counters.GHOST}  — Safety net (skip)`);
  console.log('');

  if (counters.SUSPECT > 0) {
    console.log('  ❌ GATE FAILED — review SUSPECTs before proceeding');
    process.exit(1);
  } else {
    console.log('  ✅ GATE PASSED — no dead code suspects');
    process.exit(0);
  }
}

main();
