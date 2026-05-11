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
 *   - Supabase env vars in .env.local (NEXT_PUBLIC_SUPABASE_URL, etc.)
 *
 * Note: Env vars are loaded from .env.local. If you haven't configured
 * them yet, run `npx supabase status` to get the correct values.
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

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

console.log('\n═══════════════════════════════════════════════');
console.log('  ✅ CI: LOCAL pipeline passed!');
console.log('═══════════════════════════════════════════════');
