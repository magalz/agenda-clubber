import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

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
const db = drizzle(sql);

try {
    const info = await sql`SELECT current_database() AS db, current_user AS usr, current_setting('server_version') AS version`;
    console.log('[migrate] connected:', info[0]);

    const schemas = await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('drizzle','public') ORDER BY schema_name`;
    console.log('[migrate] schemas present:', schemas.map(r => r.schema_name));

    const drizzleTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'drizzle'`;
    console.log('[migrate] drizzle.* tables:', drizzleTables.map(r => r.table_name));

    const publicTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('[migrate] public.* tables:', publicTables.map(r => r.table_name));

    console.log('[migrate] applying migrations from ./supabase/migrations ...');
    await migrate(db, { migrationsFolder: './supabase/migrations' });
    console.log('[migrate] migrations applied successfully');
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
