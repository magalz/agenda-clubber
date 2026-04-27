import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const AUTH_DIR = path.join(__dirname, '.auth');
export const STORAGE_STATE = path.join(AUTH_DIR, 'user.json');

const E2E_EMAIL = 'e2e-artist@agendaclubber.com';
const E2E_PASSWORD = 'E2eArtist2026!';
const E2E_CLAIMER_EMAIL = 'e2e-claimer@agendaclubber.com';
const E2E_CLAIMER_PASSWORD = 'E2eClaimer2026!';

const DEFAULT_PRIVACY = {
    mode: 'public',
    fields: { social_links: 'public', presskit: 'public', bio: 'public', genre: 'public' },
};

async function globalSetup() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E global setup');
    }
    if (!databaseUrl) {
        throw new Error('Missing DATABASE_URL for E2E global setup');
    }
    if (!publishableKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for E2E global setup');
    }

    const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const sql = postgres(databaseUrl, { max: 1, prepare: false });

    try {
        // ── 1. Ensure test users exist ──────────────────────────────────────────
        const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });

        const mainUserId = await upsertUser(allUsers, E2E_EMAIL, E2E_PASSWORD);
        const claimerUserId = await upsertUser(allUsers, E2E_CLAIMER_EMAIL, E2E_CLAIMER_PASSWORD);

        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, mainUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, claimerUserId);

        // ── 2. Ensure profiles exist (direct SQL — bypasses PostgREST schema cache) ──
        const mainProfileId = await upsertProfile(sql, mainUserId, 'E2E Artist', 'artista');
        const claimerProfileId = await upsertProfile(sql, claimerUserId, 'E2E Claimer', 'artista');

        // ── 3. Seed test artists ─────────────────────────────────────────────────
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Ghost XYZ'}`;
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Inexistente XYZ'}`;
        // Reset main user's artist so they can onboard fresh each run
        await sql`DELETE FROM artists WHERE profile_id = ${mainProfileId}`;

        // 'Test DJ' — orphan artist (profile_id IS NULL), claimable
        await sql`
            INSERT INTO artists (artistic_name, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Test DJ'}, ${'São Paulo, SP'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(DEFAULT_PRIVACY)})
            ON CONFLICT (artistic_name) DO UPDATE
              SET profile_id = NULL,
                  status = 'approved',
                  location = EXCLUDED.location,
                  genre_primary = EXCLUDED.genre_primary
        `;

        // 'Already Claimed DJ' — owned by claimer profile (profile_id IS NOT NULL)
        await sql`
            INSERT INTO artists (artistic_name, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Already Claimed DJ'}, ${'Rio de Janeiro, RJ'}, ${'House'}, ${claimerProfileId}, ${'approved'}, true, ${sql.json(DEFAULT_PRIVACY)})
            ON CONFLICT (artistic_name) DO UPDATE
              SET profile_id = ${claimerProfileId},
                  status = 'approved',
                  location = EXCLUDED.location,
                  genre_primary = EXCLUDED.genre_primary
        `;

        // ── 4. Sign in headless via @supabase/ssr to capture session cookies ────
        const collectedCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

        const ssrClient = createServerClient(supabaseUrl, publishableKey, {
            cookies: {
                getAll: () => [],
                setAll: (cookiesToSet) => {
                    collectedCookies.push(...cookiesToSet);
                },
            },
        });

        const { error: signInError } = await ssrClient.auth.signInWithPassword({
            email: E2E_EMAIL,
            password: E2E_PASSWORD,
        });

        if (signInError) {
            throw new Error(`[global-setup] signInWithPassword failed: ${signInError.message}`);
        }

        if (collectedCookies.length === 0) {
            throw new Error('[global-setup] No auth cookies captured from sign-in');
        }

        const url = new URL(BASE_URL);
        const storageState = {
            cookies: collectedCookies.map((c) => ({
                name: c.name,
                value: c.value,
                domain: url.hostname,
                path: c.options.path ?? '/',
                expires: c.options.maxAge ? Math.floor(Date.now() / 1000) + c.options.maxAge : -1,
                httpOnly: c.options.httpOnly ?? true,
                secure: c.options.secure ?? false,
                sameSite: ((c.options.sameSite as string | undefined)?.replace(/^./, (s) => s.toUpperCase()) ?? 'Lax') as 'Lax' | 'Strict' | 'None',
            })),
            origins: [],
        };

        if (!fs.existsSync(AUTH_DIR)) {
            fs.mkdirSync(AUTH_DIR, { recursive: true });
        }
        fs.writeFileSync(STORAGE_STATE, JSON.stringify(storageState, null, 2));
    } finally {
        await sql.end({ timeout: 5 });
    }

    async function upsertUser(
        existingUsers: { id: string; email?: string }[],
        email: string,
        password: string
    ): Promise<string> {
        const existing = existingUsers.find((u) => u.email === email);
        if (existing) return existing.id;

        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (error) throw new Error(`[global-setup] Failed to create user ${email}: ${error.message}`);
        return data.user.id;
    }
}

async function assertAuthUserVisible(
    sql: ReturnType<typeof postgres>,
    supabaseUrl: string,
    databaseUrl: string,
    userId: string
): Promise<void> {
    const rows = await sql<{ exists: boolean }[]>`
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = ${userId}) AS exists
    `;
    if (!rows[0].exists) {
        const supabaseHost = new URL(supabaseUrl).host;
        const dbHost = (() => {
            try { return new URL(databaseUrl).host; } catch { return '<invalid DATABASE_URL>'; }
        })();
        throw new Error(
            `[global-setup] Auth user ${userId} foi criado via Supabase Auth API (${supabaseHost}) ` +
            `mas não existe em auth.users acessada via DATABASE_URL (${dbHost}). ` +
            `Verifique que NEXT_PUBLIC_SUPABASE_URL e DATABASE_URL apontam para o MESMO projeto Supabase.`
        );
    }
}

async function upsertProfile(
    sql: ReturnType<typeof postgres>,
    userId: string,
    nickname: string,
    role: 'artista' | 'produtor'
): Promise<string> {
    const rows = await sql<{ id: string }[]>`
        INSERT INTO profiles (user_id, nickname, role)
        VALUES (${userId}, ${nickname}, ${role})
        ON CONFLICT (user_id) DO UPDATE
          SET nickname = EXCLUDED.nickname,
              role = EXCLUDED.role
        RETURNING id
    `;
    return rows[0].id;
}

export default globalSetup;
