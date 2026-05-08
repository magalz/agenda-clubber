#!/usr/bin/env node

/**
 * preflight.mjs
 *
 * Sync check automation — executa o Pre-Flight Check do CLAUDE.md:
 *
 * 1. Fetch origin/main
 * 2. Compara main local vs remote
 * 3. Verifica se worktree contém main
 * 4. Compara sprint-status local vs remote
 *
 * Uso:
 *   node _bmad/scripts/preflight.mjs        # verificação completa
 *   npm run preflight                        # via package.json
 *
 * Exit codes:
 *   0 — tudo sync
 *   1 — problemas detectados
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function header(text) {
  console.log(`\n── ${text} ─${'─'.repeat(Math.max(0, 60 - text.length - 4))}`);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  PRE-FLIGHT CHECK');
console.log('═══════════════════════════════════════════════════════════');

let hasIssues = false;

// ── Step 1: Fetch remote ──────────────────────────────────────────
header('Passo 1 — Obter estado remoto');

const fetch = run('git fetch origin main');
if (fetch === null) {
  console.log('  ✘ Falha ao fazer fetch do origin/main. Verifique sua conexão.');
  process.exit(1);
}
console.log('  ✔ origin/main obtido');

const ORIGIN_MAIN = run('git rev-parse origin/main');
console.log(`  origin/main: ${ORIGIN_MAIN?.slice(0, 12) || '?'}`);

// ── Step 2: Compare main vs remote ────────────────────────────────
header('Passo 2 — Comparar main local com remote');

const LOCAL_MAIN = run('git rev-parse main');
console.log(`  main local:  ${LOCAL_MAIN?.slice(0, 12) || '?'}`);

if (LOCAL_MAIN !== ORIGIN_MAIN) {
  hasIssues = true;
  const behind = run('git log --oneline main..origin/main');
  const count = behind ? behind.split('\n').filter(Boolean).length : 0;

  console.log('');
  console.log(`  ⚠  Main local está ${count} commit(s) atrás do origin/main.`);
  if (behind) {
    console.log('');
    console.log(`  Commits faltando:`);
    for (const line of behind.split('\n').filter(Boolean)) {
      console.log(`    ${line}`);
    }
  }

  // Check for uncommitted changes
  const status = run('git status --short');
  const uncommitted = status ? status.split('\n').filter(Boolean).length : 0;
  if (uncommitted > 0) {
    console.log('');
    console.log(`  ⚠  Há ${uncommitted} arquivo(s) modificado(s) não commitados:`);
    for (const line of (status || '').split('\n').filter(Boolean)) {
      console.log(`    ${line}`);
    }
  }

  console.log('');
  console.log('  ➡  PRÓXIMO: git pull origin main');
} else {
  console.log('  ✔ main está sync com origin/main');
}

// ── Step 3: Check worktree vs main ────────────────────────────────
header('Passo 3 — Checar se worktree está sync com main');

const CURRENT_BRANCH = run('git rev-parse --abbrev-ref HEAD');
const CONTAINS_MAIN = run('git merge-base --is-ancestor main HEAD');

if (CONTAINS_MAIN === null) {
  hasIssues = true;
  console.log('');
  console.log(`  ⚠  Branch atual (${CURRENT_BRANCH}) NÃO contém o HEAD de main.`);
  console.log('');
  console.log('  ➡  PRÓXIMO: git rebase main ou git merge main');
} else {
  console.log(`  ✔ Branch atual (${CURRENT_BRANCH}) contém o HEAD de main`);
}

// ── Step 4: Sprint-status comparison ──────────────────────────────
header('Passo 4 — Sprint-status como fonte de verdade');

const localStatusPath = resolve(PROJECT_ROOT, '_bmad-output/implementation-artifacts/sprint-status.yaml');
const remoteStatus = run('git show origin/main:_bmad-output/implementation-artifacts/sprint-status.yaml');

if (!existsSync(localStatusPath)) {
  hasIssues = true;
  console.log('  ⚠  sprint-status.yaml local não encontrado');
} else if (remoteStatus === null) {
  console.log('  ⚠  Não foi possível ler sprint-status.yaml do origin/main');
} else {
  const localStatus = readFileSync(localStatusPath, 'utf-8');
  if (localStatus === remoteStatus) {
    console.log('  ✔ sprint-status.yaml local está igual ao origin/main');
  } else {
    hasIssues = true;
    console.log('');
    console.log('  ⚠  sprint-status.yaml LOCAL DIFERE do origin/main.');
    console.log('      Use o estado do origin/main como fonte de verdade.');
    console.log('');
    console.log('  ➡  Para ver a diferença:');
    console.log('      git diff origin/main:_bmad-output/implementation-artifacts/sprint-status.yaml');
  }
}

// ── Summary ───────────────────────────────────────────────────────
header('Resumo');

if (hasIssues) {
  console.log('');
  console.log('  ⚠  Foram detectados problemas de sincronia.');
  console.log('      Resolva antes de prosseguir com qualquer ação no projeto.');
  console.log('');
  process.exit(1);
} else {
  console.log('');
  console.log('  ✔  Tudo sync. Pode prosseguir.');
  console.log('');
  process.exit(0);
}
