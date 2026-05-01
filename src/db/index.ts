import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as auth from './schema/auth';
import * as collectives from './schema/collectives';
import * as collectiveMembers from './schema/collective-members';
import * as artists from './schema/artists';
import * as events from './schema/events';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required in production');
}

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres';

const globalForDb = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> };
const client = globalForDb._pgClient ?? postgres(connectionString);
if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;

export const db = drizzle(client, { schema: { ...auth, ...collectives, ...collectiveMembers, ...artists, ...events } });
