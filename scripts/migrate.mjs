import postgres from 'postgres';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('[migrate] DATABASE_URL not set');
    process.exit(1);
}

const u = new URL(url);
console.log(`[migrate] target host=${u.host} user=${u.username} db=${u.pathname.slice(1)}`);

const sql = postgres(url, {
    max: 1,
    prepare: false,
    onnotice: (n) => console.log('[notice]', n.code, n.message),
});

const MIGRATIONS_DIR = path.resolve('supabase/migrations');

try {
    const info = await sql`SELECT current_database() AS db, current_user AS usr, current_setting('server_version') AS version`;
    console.log('[migrate] connected:', info[0]);

    await sql`
        CREATE TABLE IF NOT EXISTS public._manual_migrations (
            filename text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    `;

    const applied = await sql`SELECT filename FROM public._manual_migrations`;
    const appliedSet = new Set(applied.map((r) => r.filename));
    console.log(`[migrate] already applied: ${appliedSet.size} migrations`);

    const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
    const files = entries
        .filter((e) => e.isFile() && e.name.endsWith('.sql'))
        .map((e) => e.name)
        .sort();

    console.log(`[migrate] discovered ${files.length} .sql files`);

    let appliedCount = 0;
    for (const filename of files) {
        if (appliedSet.has(filename)) {
            console.log(`[migrate] skip (already applied): ${filename}`);
            continue;
        }

        const fullPath = path.join(MIGRATIONS_DIR, filename);
        const content = await fs.readFile(fullPath, 'utf8');
        console.log(`[migrate] applying: ${filename}`);

        await sql.begin(async (trx) => {
            await trx.unsafe(content);
            await trx`INSERT INTO public._manual_migrations (filename) VALUES (${filename})`;
        });

        appliedCount += 1;
        console.log(`[migrate] applied: ${filename}`);
    }

    console.log(`[migrate] done — applied ${appliedCount} new migration(s)`);
    await sql.end({ timeout: 5 });
    process.exit(0);
} catch (err) {
    console.error('[migrate] FAILED:', err);
    if (err && typeof err === 'object' && 'cause' in err) {
        console.error('[migrate] cause:', err.cause);
    }
    await sql.end({ timeout: 5 });
    process.exit(1);
}
