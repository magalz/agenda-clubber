import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('[migrate] DATABASE_URL not set');
    process.exit(1);
}

const sql = postgres(url, {
    max: 1,
    prepare: false,
    onnotice: (n) => console.log('[notice]', n.code, n.message),
});
const db = drizzle(sql);

try {
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
