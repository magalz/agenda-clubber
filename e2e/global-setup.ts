import { chromium } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const AUTH_DIR = path.join(__dirname, '.auth');
export const STORAGE_STATE = path.join(AUTH_DIR, 'user.json');

const E2E_EMAIL = 'e2e-artist@agendaclubber.com';
const E2E_PASSWORD = 'E2eArtist2026!';
const E2E_CLAIMER_EMAIL = 'e2e-claimer@agendaclubber.com';
const E2E_CLAIMER_PASSWORD = 'E2eClaimer2026!';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, any, any>;

const DEFAULT_PRIVACY = {
    mode: 'public',
    fields: { social_links: 'public', presskit: 'public', bio: 'public', genre: 'public' },
};

async function globalSetup() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E global setup');
    }

    const admin: AdminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Ensure test users exist ──────────────────────────────────────────
    const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });

    const mainUserId = await upsertUser(admin, allUsers, E2E_EMAIL, E2E_PASSWORD);
    const claimerUserId = await upsertUser(admin, allUsers, E2E_CLAIMER_EMAIL, E2E_CLAIMER_PASSWORD);

    // ── 2. Ensure profiles exist ─────────────────────────────────────────────
    const mainProfileId = await upsertProfile(admin, mainUserId, 'E2E Artist', 'artista');
    const claimerProfileId = await upsertProfile(admin, claimerUserId, 'E2E Claimer', 'artista');

    // ── 3. Seed test artists ─────────────────────────────────────────────────

    // Clean up transient names from previous test runs
    await admin.from('artists').delete().ilike('artistic_name', 'Artista Ghost XYZ');
    await admin.from('artists').delete().ilike('artistic_name', 'Artista Inexistente XYZ');

    // Reset main user's artist so they can onboard fresh each run
    if (mainProfileId) {
        await admin.from('artists').delete().eq('profile_id', mainProfileId);
    }

    // 'Test DJ' — orphan artist (profile_id IS NULL), claimable
    await admin.from('artists').upsert(
        {
            artistic_name: 'Test DJ',
            location: 'São Paulo, SP',
            genre_primary: 'Techno',
            profile_id: null,
            status: 'approved',
            is_verified: false,
            privacy_settings: DEFAULT_PRIVACY,
        },
        { onConflict: 'artistic_name' }
    );
    // Ensure it remains orphan even if previously claimed
    await admin.from('artists')
        .update({ profile_id: null, status: 'approved' })
        .ilike('artistic_name', 'Test DJ');

    // 'Already Claimed DJ' — owned by claimer profile (profile_id IS NOT NULL)
    if (claimerProfileId) {
        await admin.from('artists').upsert(
            {
                artistic_name: 'Already Claimed DJ',
                location: 'Rio de Janeiro, RJ',
                genre_primary: 'House',
                profile_id: claimerProfileId,
                status: 'approved',
                is_verified: true,
                privacy_settings: DEFAULT_PRIVACY,
            },
            { onConflict: 'artistic_name' }
        );
        await admin.from('artists')
            .update({ profile_id: claimerProfileId })
            .ilike('artistic_name', 'Already Claimed DJ');
    }

    // ── 4. Log in via browser, persist session ───────────────────────────────
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('#email').fill(E2E_EMAIL);
    await page.locator('#password').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await context.storageState({ path: STORAGE_STATE });
    await browser.close();
}

async function upsertUser(
    admin: AdminClient,
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

async function upsertProfile(
    admin: AdminClient,
    userId: string,
    nickname: string,
    role: 'artista' | 'produtor'
): Promise<string | null> {
    const { data, error } = await admin
        .from('profiles')
        .upsert({ user_id: userId, nickname, role }, { onConflict: 'user_id' })
        .select('id')
        .single();

    if (error) {
        console.error(`[global-setup] Failed to upsert profile for ${userId}:`, error.message);
        return null;
    }
    return (data as { id: string }).id;
}

export default globalSetup;
