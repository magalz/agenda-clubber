import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');
export const STORAGE_STATE = path.join(AUTH_DIR, 'user.json');
export const PRODUCER_STORAGE_STATE = path.join(AUTH_DIR, 'producer.json');
export const OTHER_COLLECTIVE_STORAGE_STATE = path.join(AUTH_DIR, 'other-collective.json');

const E2E_EMAIL = 'e2e-artist@agendaclubber.com';
const E2E_PASSWORD = 'E2eArtist2026!';
const E2E_CLAIMER_EMAIL = 'e2e-claimer@agendaclubber.com';
const E2E_CLAIMER_PASSWORD = 'E2eClaimer2026!';
const E2E_PRODUCER_EMAIL = 'e2e-producer@agendaclubber.com';
const E2E_PRODUCER_PASSWORD = 'E2eProducer2026!';
const E2E_OTHER_PRODUCER_EMAIL = 'e2e-producer-b@agendaclubber.com';
const E2E_OTHER_PRODUCER_PASSWORD = 'E2eProducerB2026!';

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
        const otherProducerUserId = await upsertUser(allUsers, E2E_OTHER_PRODUCER_EMAIL, E2E_OTHER_PRODUCER_PASSWORD);

        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, mainUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, claimerUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, producerUserId);
        await assertAuthUserVisible(sql, supabaseUrl, databaseUrl, otherProducerUserId);

        // ── 2. Clean up all E2E data deterministically (FK-safe order) ────────
        // Delete events first (FK: events.created_by → profiles.id ON DELETE SET NULL + NOT NULL)
        await sql`DELETE FROM events WHERE created_by IN (SELECT id FROM profiles WHERE user_id IN (${mainUserId}, ${claimerUserId}, ${producerUserId}, ${otherProducerUserId}))`;
        // Delete artists next (FK: artists.profile_id → profiles.id)
        await sql`DELETE FROM artists WHERE artistic_name = ${'Test DJ'}`;
        await sql`DELETE FROM artists WHERE artistic_name = ${'Already Claimed DJ'}`;
        await sql`DELETE FROM artists WHERE artistic_name = ${'Ghost DJ'}`;
        await sql`DELETE FROM artists WHERE artistic_name = ${'Pending DJ'}`;
        await sql`DELETE FROM artists WHERE artistic_name = ${'Collectives DJ'}`;
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Ghost XYZ'}`;
        await sql`DELETE FROM artists WHERE artistic_name ILIKE ${'Artista Inexistente XYZ'}`;
        // Main user's artist: delete by old profile_id before profile is removed
        await sql`DELETE FROM artists WHERE profile_id = (SELECT id FROM profiles WHERE user_id = ${mainUserId})`;
        // Now delete profiles (safe: no artists reference them anymore)
        await sql`DELETE FROM profiles WHERE user_id IN (${mainUserId}, ${claimerUserId}, ${producerUserId}, ${otherProducerUserId})`;

        // ── 3. Recreate profiles ────────────────────────────────────────────────
        const _mainProfileId = await insertProfile(sql, mainUserId, 'E2E Artist', 'artista');
        const claimerProfileId = await insertProfile(sql, claimerUserId, 'E2E Claimer', 'artista');
        const producerProfileId = await insertProfile(sql, producerUserId, 'E2E Producer', 'produtor');
        const otherProducerProfileId = await insertProfile(sql, otherProducerUserId, 'E2E Other Producer', 'produtor');

        // ── 4. Seed test artists ─────────────────────────────────────────────────

        // 'Test DJ' — orphan artist (profile_id IS NULL), claimable, public mode
        await sql`DELETE FROM artists WHERE artistic_name = ${'Test DJ'}`;
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings, bio)
            VALUES (${'Test DJ'}, ${'test-dj'}, ${'São Paulo, SP'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(DEFAULT_PRIVACY)}, ${'Bio do Test DJ'})
        `;

        // 'Already Claimed DJ' — owned by claimer profile
        await sql`DELETE FROM artists WHERE artistic_name = ${'Already Claimed DJ'}`;
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Already Claimed DJ'}, ${'already-claimed-dj'}, ${'Rio de Janeiro, RJ'}, ${'House'}, ${claimerProfileId}, ${'approved'}, true, ${sql.json(DEFAULT_PRIVACY)})
        `;

        // 'Ghost DJ' — approved but ghost mode → 404 for public
        await sql`DELETE FROM artists WHERE artistic_name = ${'Ghost DJ'}`;
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Ghost DJ'}, ${'ghost-dj'}, ${'Fortaleza, CE'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(GHOST_PRIVACY)})
        `;

        // 'Pending DJ' — pending_approval → 404 for everyone
        await sql`DELETE FROM artists WHERE artistic_name = ${'Pending DJ'}`;
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
            VALUES (${'Pending DJ'}, ${'pending-dj'}, ${'Fortaleza, CE'}, ${'House'}, NULL, ${'pending_approval'}, false, ${sql.json(DEFAULT_PRIVACY)})
        `;

        // 'Collectives DJ' — collectives_only mode → produtor sees bio, anon does not
        await sql`DELETE FROM artists WHERE artistic_name = ${'Collectives DJ'}`;
        await sql`
            INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings, bio)
            VALUES (${'Collectives DJ'}, ${'collectives-dj'}, ${'Recife, PE'}, ${'Drum and Bass'}, NULL, ${'approved'}, false, ${sql.json(COLLECTIVES_ONLY_PRIVACY)}, ${'Bio secreta do Collectives DJ'})
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

        // ── 7. Seed second collective for cross-collective conflict detection (Story 3.3) ──
        const otherCollectiveName = 'E2E Other Collective';
        const existingOtherCollective = await sql<{ id: string }[]>`
            SELECT id FROM collectives WHERE name = ${otherCollectiveName} LIMIT 1
        `;
        let otherCollectiveId: string;
        if (existingOtherCollective.length > 0) {
            otherCollectiveId = existingOtherCollective[0].id;
            await sql`
                UPDATE collectives SET status = 'active', owner_id = ${otherProducerProfileId}, whatsapp_phone = ${'+5511987654321'}
                WHERE id = ${otherCollectiveId}
            `;
        } else {
            const rows = await sql<{ id: string }[]>`
                INSERT INTO collectives (name, location, genre_primary, owner_id, status, whatsapp_phone)
                VALUES (${otherCollectiveName}, ${'Recife, PE'}, ${'Techno'}, ${otherProducerProfileId}, ${'active'}, ${'+5511987654321'})
                RETURNING id
            `;
            otherCollectiveId = rows[0].id;
        }

        await sql`
            DELETE FROM collective_members
            WHERE collective_id = ${otherCollectiveId} AND profile_id = ${otherProducerProfileId}
        `;
        await sql`
            INSERT INTO collective_members (collective_id, profile_id, role)
            VALUES (${otherCollectiveId}, ${otherProducerProfileId}, ${'collective_admin'})
        `;

        // Seed conflicting event for cross-collective detection
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowUtc = new Date(`${tomorrowStr}T12:00:00Z`);

        const day2 = new Date(tomorrow);
        day2.setUTCDate(day2.getUTCDate() + 1);
        const day2Str = day2.toISOString().split('T')[0];
        const day2Utc = new Date(`${day2Str}T12:00:00Z`);

        const day3 = new Date(tomorrow);
        day3.setUTCDate(day3.getUTCDate() + 2);
        const day3Str = day3.toISOString().split('T')[0];
        const day3Utc = new Date(`${day3Str}T12:00:00Z`);

        await sql`
            DELETE FROM events WHERE collective_id = ${otherCollectiveId}
        `;

        // Event 1: planning, all privacy flags off → name/location/lineup hidden cross-collective
        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, lineup, status, is_name_public, is_location_public, is_lineup_public, created_by)
            VALUES (
                ${otherCollectiveId},
                ${'Festa Concorrente'},
                ${tomorrowStr},
                ${tomorrowUtc},
                ${'Recife, PE'},
                ${'Techno'},
                ${sql.json(['DJ Externo'])},
                ${'planning'},
                false, false, false,
                ${otherProducerProfileId}
            )
        `;

        // Event 2: planning, isNamePublic=true → only name visible cross-collective
        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, lineup, status, is_name_public, is_location_public, is_lineup_public, created_by)
            VALUES (
                ${otherCollectiveId},
                ${'Evento Nome Visivel'},
                ${day2Str},
                ${day2Utc},
                ${'Olinda, PE'},
                ${'House'},
                ${sql.json(['DJ A'])},
                ${'planning'},
                true, false, false,
                ${otherProducerProfileId}
            )
        `;

        // Event 3: confirmed → everything visible cross-collective
        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, lineup, status, created_by)
            VALUES (
                ${otherCollectiveId},
                ${'Festa Confirmada'},
                ${day3Str},
                ${day3Utc},
                ${'Recife Antigo, PE'},
                ${'Drum and Bass'},
                ${sql.json(['DJ B', 'MC C'])},
                ${'confirmed'},
                ${otherProducerProfileId}
            )
        `;

        // ── 8. Seed events for Ethical Delay test (Story 3.5) ──────────────────────
        const ethicalDelayDate = new Date();
        ethicalDelayDate.setUTCDate(ethicalDelayDate.getUTCDate() + 4);
        const ethicalDelayDateStr = ethicalDelayDate.toISOString().split('T')[0];
        const ethicalDelayUtc = new Date(`${ethicalDelayDateStr}T12:00:00Z`);

        const greenEventDate = new Date();
        greenEventDate.setUTCDate(greenEventDate.getUTCDate() + 6);
        const greenEventDateStr = greenEventDate.toISOString().split('T')[0];
        const greenEventUtc = new Date(`${greenEventDateStr}T12:00:00Z`);

        await sql`DELETE FROM events WHERE collective_id = ${e2eCollectiveId}`;

        // RED event: triggers EthicalDelayButton
        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, lineup, status, conflict_level, conflict_justification, created_by)
            VALUES (
                ${e2eCollectiveId},
                ${'Evento Delay Ético'},
                ${ethicalDelayDateStr},
                ${ethicalDelayUtc},
                ${'São Paulo, SP'},
                ${'Techno'},
                ${sql.json(['DJ Test'])},
                ${'planning'},
                ${'red'},
                ${'Conflito crítico simulado para teste de delay ético'},
                ${producerProfileId}
            )
        `;

        // GREEN event: instant confirm, no delay
        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, lineup, status, conflict_level, conflict_justification, created_by)
            VALUES (
                ${e2eCollectiveId},
                ${'Evento Sem Conflito'},
                ${greenEventDateStr},
                ${greenEventUtc},
                ${'São Paulo, SP'},
                ${'Samba'},
                ${sql.json(['DJ Samba'])},
                ${'planning'},
                ${'green'},
                ${null},
                ${producerProfileId}
            )
        `;

        // ── 8b. Seed event_conflicts for Story 4.1 (Conflict Resolution Sheet) ────
        const otherEventId = await sql`
            SELECT id FROM events WHERE collective_id = ${otherCollectiveId} LIMIT 1
        `.then((rows) => rows[0]?.id);

        const delayEventId = await sql`
            SELECT id FROM events WHERE name = ${'Evento Delay Ético'} LIMIT 1
        `.then((rows) => rows[0]?.id);

        if (otherEventId && delayEventId) {
            await sql`
                INSERT INTO event_conflicts (event_a_id, event_b_id, rule, level, justification, status)
                VALUES (${delayEventId}, ${otherEventId}, ${'genre'}, ${'red'}, ${'Conflito Vermelho: Mesmo gênero Techno em janela de 48h'}, ${'open'})
            `;
        }

        // ── 8c. Seed YELLOW conflict event + pair for Story 4.1 (privacy masking) ──
        const yellowEventDate = new Date();
        yellowEventDate.setUTCDate(yellowEventDate.getUTCDate() + 7);
        const yellowEventDateStr = yellowEventDate.toISOString().split('T')[0];
        const yellowEventUtc = new Date(`${yellowEventDateStr}T12:00:00Z`);

        await sql`
            INSERT INTO events (collective_id, name, event_date, event_date_utc, location_name, genre_primary, status, conflict_level, conflict_justification, created_by)
            VALUES (
                ${e2eCollectiveId},
                ${'Evento Amarelo'},
                ${yellowEventDateStr},
                ${yellowEventUtc},
                ${'São Paulo, SP'},
                ${'Techno'},
                ${'planning'},
                ${'yellow'},
                ${'Conflito Amarelo: Mesmo gênero Techno em janela de 5 dias'},
                ${producerProfileId}
            )
        `;

        const yellowEventId = await sql`
            SELECT id FROM events WHERE name = ${'Evento Amarelo'} LIMIT 1
        `.then((rows) => rows[0]?.id);

        if (yellowEventId && otherEventId) {
            await sql`
                INSERT INTO event_conflicts (event_a_id, event_b_id, rule, level, justification, status)
                VALUES (${yellowEventId}, ${otherEventId}, ${'genre'}, ${'yellow'}, ${'Conflito Amarelo: Mesmo gênero Techno em janela de 5 dias'}, ${'open'})
            `;
        }

        // ── 9. Sign in other producer user ──────────────────────────────────────────
        await saveStorageState(supabaseUrl, publishableKey, E2E_OTHER_PRODUCER_EMAIL, E2E_OTHER_PRODUCER_PASSWORD, OTHER_COLLECTIVE_STORAGE_STATE);

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

async function insertProfile(
    sql: ReturnType<typeof postgres>,
    userId: string,
    nickname: string,
    role: 'artista' | 'produtor'
): Promise<string> {
    const rows = await sql<{ id: string }[]>`
        INSERT INTO profiles (user_id, nickname, role)
        VALUES (${userId}, ${nickname}, ${role})
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
