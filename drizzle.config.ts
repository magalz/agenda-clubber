import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/db/schema/*.ts', '!./src/db/schema/*.test.ts'],
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
    ssl: process.env.DATABASE_URL ? 'require' : false,
  },
});
