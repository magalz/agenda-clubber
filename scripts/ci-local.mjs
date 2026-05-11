#!/usr/bin/env node

/**
 * ci-local.mjs — Run the full CI pipeline against local Supabase Docker.
 *
 * Usage:
 *   npm run ci:local
 *   npm run ci:local -- --skip-build
 *
 * Prerequisites:
 *   - Docker running
 *   - `supabase start` running (with migrations applied)
 *   - Supabase env vars in .env.local or set in shell
 *
 * Note: This script loads .env.local automatically if available.
 *       If not, set the env vars manually before running.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// Load .env.local manually (Next.js-style)
const envLocal = resolve(ROOT, '.env.local');
if (existsSync(envLocal)) {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const eqIdx = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`  ✘ Missing ${key}. Run \`npx supabase status\` to get the values and set them in .env.local`);
        process.exit(1);
    }
}

function run(cmd, opts = {}) {
    console.log(`\n  → ${cmd}`);
    try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8', ...opts });
    } catch {
        console.error(`\n  ✘ Failed: ${cmd}`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  CI: LOCAL — Supabase Docker');
console.log('═══════════════════════════════════════════════');
console.log(`  API:  ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`  DB:   ${process.env.DATABASE_URL}`);

// Step 1: Lint & TypeCheck
console.log('\n── 1. Lint & TypeCheck ──────────────────────────');
run('npm run lint:ci');
run('npm run type-check');

// Step 2: Build (skip with --skip-build)
console.log('\n── 2. Build ─────────────────────────────────────');
if (!skipBuild) {
    run('npm run build');
} else {
    console.log('  ⏭  Skipped (--skip-build)');
}

// Step 3: Unit Tests
console.log('\n── 3. Unit Tests ────────────────────────────────');
run('npm run test', { env: { ...process.env, CI: 'true' } });

// Step 4: E2E Tests
console.log('\n── 4. E2E Tests ─────────────────────────────────');
run('npx playwright test', { env: { ...process.env, CI: 'true' }, timeout: 5 * 60 * 1000 });

console.log('\n═══════════════════════════════════════════════');
console.log('  ✅ CI: LOCAL pipeline passed!');
console.log('═══════════════════════════════════════════════');
