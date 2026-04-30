import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');
export const STORAGE_STATE = path.join(AUTH_DIR, 'user.json');
export const PRODUCER_STORAGE_STATE = path.join(AUTH_DIR, 'producer.json');

const E2E_EMAIL = 'e2e-artist@agendaclubber.com';
const E2E_PASSWORD = 'E2eArtist2026!';
const E2E_CLAIMER_EMAIL = 'e2e-claimer@agendaclubber.com';
const E2E_CLAIMER_PASSWORD = 'E2eClaimer2026!';
const E2E_PRODUCER_EMAIL = 'e2e-producer@agendaclubber.com';
const E2E_PRODUCER_PASSWORD = 'E2eProducer2026!';

const DEFAULT_PRIVACY = {
    mode: 'public',
    fields: { social_links: 'public', presskit: 'public', bio: 'public', genre: 'public' },
};

const COLLECTIVES_ONLY_PRIVACY = {
    mode: 'collectives_only',
    fields: { social_links: 'collectives_only', presskit: 'collectives_only', bio: 'collectives_only', genre: 'collectives_only' },
};

const GHOST_PRIVACY = {
    mode: 'ghost',
    fields: { social_links: 'private', presskit: 'private', bio: 'private', genre: 'private' },
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
        const producerUserId = await upsertUser(allUsers, E2E_PRODUCER_EMAIL, E2E_PRODUCER_PASSWORD);

        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, mainUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, claimerUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, producerUserId);

        // ── 2. Ensure profiles exist ────────────────────────────────────────────
        const mainProfileId = await upsertProfile(sql, mainUserId, 'E2E Artist', 'artista');
        const claimerProfileId = await upsertProfile(sql, claimerUserId, 'E2E Claimer', 'artista');
        const producerProfileId = await upsertProfile(sql, producerUserId, 'E2E Producer', 'produtor');

        // ── 3. Seed test artists ─────────────────────────────────────────────────
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Ghost XYZ'}`;
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Inexistente XYZ'}`;
        // Reset main user's artist so they can onboard fresh each run
        await sql`DELETE FROM artists WHERE profile_id = ${mainProfileId}`;

        // 'Test DJ' — orphan artist (profile_id IS NULL), claimable, public mode
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings, bio)
            VALUES (${'Test DJ'}, ${'test-dj'}, ${'São Paulo, SP'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(DEFAULT_PRIVACY)}, ${'Bio do Test DJ'})
            ON CONFLICT (artistic_name) DO UPDATE
              SET slug = 'test-dj',
                  profile_id = NULL,
                  status = 'approved',
                  location = EXCLUDED.location,
                  genre_primary = EXCLUDED.genre_primary,
                  bio = EXCLUDED.bio,
                  privacy_settings = ${sql.json(DEFAULT_PRIVACY)}
        `;

        // 'Already Claimed DJ' — owned by claimer profile
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Already Claimed DJ'}, ${'already-claimed-dj'}, ${'Rio de Janeiro, RJ'}, ${'House'}, ${claimerProfileId}, ${'approved'}, true, ${sql.json(DEFAULT_PRIVACY)})
            ON CONFLICT (artistic_name) DO UPDATE
              SET slug = 'already-claimed-dj',
                  profile_id = ${claimerProfileId},
                  status = 'approved',
                  location = EXCLUDED.location,
                  genre_primary = EXCLUDED.genre_primary
        `;

        // 'Ghost DJ' — approved but ghost mode → 404 for public
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Ghost DJ'}, ${'ghost-dj'}, ${'Fortaleza, CE'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(GHOST_PRIVACY)})
            ON CONFLICT (artistic_name) DO UPDATE
              SET slug = 'ghost-dj',
                  status = 'approved',
                  privacy_settings = ${sql.json(GHOST_PRIVACY)}
        `;

        // 'Pending DJ' — pending_approval → 404 for everyone
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Pending DJ'}, ${'pending-dj'}, ${'Fortaleza, CE'}, ${'House'}, NULL, ${'pending_approval'}, false, ${sql.json(DEFAULT_PRIVACY)})
            ON CONFLICT (artistic_name) DO UPDATE
              SET slug = 'pending-dj',
                  status = 'pending_approval',
                  privacy_settings = ${sql.json(DEFAULT_PRIVACY)}
        `;

        // 'Collectives DJ' — collectives_only mode → produtor sees bio, anon does not
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings, bio)
            VALUES (${'Collectives DJ'}, ${'collectives-dj'}, ${'Recife, PE'}, ${'Drum and Bass'}, NULL, ${'approved'}, false, ${sql.json(COLLECTIVES_ONLY_PRIVACY)}, ${'Bio secreta do Collectives DJ'})
            ON CONFLICT (artistic_name) DO UPDATE
              SET slug = 'collectives-dj',
                  status = 'approved',
                  bio = EXCLUDED.bio,
                  privacy_settings = ${sql.json(COLLECTIVES_ONLY_PRIVACY)}
        `;

        // ── 4. Sign in artist user ───────────────────────────────────────────────
        await saveStorageState(supabaseUrl, publishableKey, E2E_EMAIL, E2E_PASSWORD, STORAGE_STATE);

        // ── 5. Sign in producer user ─────────────────────────────────────────────
        await saveStorageState(supabaseUrl, publishableKey, E2E_PRODUCER_EMAIL, E2E_PRODUCER_PASSWORD, PRODUCER_STORAGE_STATE);

        // ── 6. Seed producer's active collective for Story 3.1 (Calendar Grid) ───
        const existingCollective = await sql<{ id: string }[]>`
            SELECT id FROM collectives WHERE name = 'E2E Producer Collective' LIMIT 1
        `;
        let e2eCollectiveId: string;
        if (existingCollective.length > 0) {
            e2eCollectiveId = existingCollective[0].id;
            await sql`
                UPDATE collectives SET status = 'active', owner_id = ${producerProfileId}
                WHERE id = ${e2eCollectiveId}
            `;
        } else {
            const rows = await sql<{ id: string }[]>`
                INSERT INTO collectives (name, location, genre_primary, owner_id, status)
                VALUES (${'E2E Producer Collective'}, ${'São Paulo, SP'}, ${'Techno'}, ${producerProfileId}, ${'active'})
                RETURNING id
            `;
            e2eCollectiveId = rows[0].id;
        }

        await sql`
            DELETE FROM collective_members
            WHERE collective_id = ${e2eCollectiveId} AND profile_id = ${producerProfileId}
        `;
        await sql`
            INSERT INTO collective_members (collective_id, profile_id, role)
            VALUES (${e2eCollectiveId}, ${producerProfileId}, ${'collective_admin'})
        `;

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

async function saveStorageState(
    supabaseUrl: string,
    publishableKey: string,
    email: string,
    password: string,
    filePath: string
): Promise<void> {
    const collectedCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

    const ssrClient = createServerClient(supabaseUrl, publishableKey, {
        cookies: {
            getAll: () => [],
            setAll: (cookiesToSet) => {
                collectedCookies.push(...cookiesToSet);
            },
        },
    });

    const { error: signInError } = await ssrClient.auth.signInWithPassword({ email, password });
    if (signInError) {
        throw new Error(`[global-setup] signInWithPassword failed for ${email}: ${signInError.message}`);
    }
    if (collectedCookies.length === 0) {
        throw new Error(`[global-setup] No auth cookies captured for ${email}`);
    }

    const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000');
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

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(storageState, null, 2));
}

export default globalSetup;
