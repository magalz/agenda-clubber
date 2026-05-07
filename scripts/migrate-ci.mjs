import postgres from 'postgres';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('[migrate-ci] DATABASE_URL not set');
    process.exit(1);
}

const MIGRATIONS_DIR = resolve('supabase/migrations');
const JOURNAL_PATH = resolve(MIGRATIONS_DIR, 'meta', '_journal.json');

async function main() {
    const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

    // Read the journal to get migration order
    const journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
    const entries = journal.entries.sort((a, b) => a.idx - b.idx);
    console.log(`[migrate-ci] Journal: ${entries.length} entries`);

    // Ensure drizzle schema and tracking table exist
    await sql.unsafe('CREATE SCHEMA IF NOT EXISTS drizzle');
    await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
        )
    `);

    // Get already-applied hashes
    const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
    const appliedHashes = new Set(applied.map(r => r.hash));

    for (const entry of entries) {
        const filename = `${entry.tag}.sql`;
        const filepath = resolve(MIGRATIONS_DIR, filename);

        // Compute hash matching drizzle-kit's method (SHA-256 of SQL content)
        const content = readFileSync(filepath, 'utf8');
        const hash = createHash('sha256').update(content).digest('hex');

        if (appliedHashes.has(hash)) {
            console.log(`[migrate-ci] SKIP ${filename} (already applied)`);
            continue;
        }

        try {
            console.log(`[migrate-ci] APPLY ${filename}...`);
            await sql.unsafe(content);
            await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`;
            console.log(`[migrate-ci] OK   ${filename}`);
        } catch (err) {
            console.error(`[migrate-ci] FAIL ${filename}: ${err.message}`);
            process.exit(1);
        }
    }

    // Verify
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log(`[migrate-ci] Public tables: ${tables.length}`);
    for (const t of tables) console.log(`  - ${t.table_name}`);

    await sql.end();
    console.log('[migrate-ci] All migrations applied successfully');
}

main().catch(err => {
    console.error('[migrate-ci] Fatal:', err.message);
    process.exit(1);
});
