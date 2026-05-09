#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return { stdout: e.stdout?.trim?.(), stderr: e.stderr?.trim?.(), failed: true };
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  SESSION START');
console.log('═══════════════════════════════════════════════════════════');

// Step 1: Preflight
console.log('\n── Phase 1: Preflight ────────────────────────────');
const preflight = run('node _bmad/scripts/preflight.mjs');
if (preflight.failed) {
  console.log('  ⚠  Preflight detected issues (non-blocking).');
  console.log('  ➡  Resolve sync issues before committing.');
} else {
  console.log('  ✔  Preflight passed.');
}

// Step 2: Resolve all customizations
console.log('\n── Phase 2: Resolve Customizations ───────────────');
const res = run('python _bmad/scripts/resolve_all.py');
if (res.failed) {
  console.log('  ✘  resolve_all failed:', res.stderr?.slice(0, 200));
} else {
  console.log(`  ✔  ${res.stdout || 'Customizations resolved.'}`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Session ready.');
console.log('═══════════════════════════════════════════════════════════');
