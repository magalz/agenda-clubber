import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import { STORAGE_STATE } from './global-setup';

/**
 * E2E tests for the Claim flow introduced in Story 2.3.
 *
 * Pre-condition: global-setup.ts creates the e2e-artist test user, seeds 'Test DJ'
 * (profile_id IS NULL, status='approved') and 'Already Claimed DJ' (profile_id != NULL).
 *
 * These tests verify the full 3-step onboarding state machine:
 *   search → claim (if hit) | create (if no hit)
 */

const DEFAULT_PRIVACY = {
    mode: 'public',
    fields: { social_links: 'public', presskit: 'public', bio: 'public', genre: 'public' },
};

// Tests share the e2e-artist user. The artists table has a unique constraint on profile_id,
// so a successful claim/create in one test prevents subsequent submissions for the same user.
// Run serially and reset state before each test.
test.describe.configure({ mode: 'serial' });

test.describe('Onboarding Claim Flow', () => {
    test.use({ storageState: STORAGE_STATE });

    test.beforeEach(async ({ page }) => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) throw new Error('DATABASE_URL not set for E2E test reset');

        const sql = postgres(databaseUrl, { max: 1, prepare: false });
        try {
            // Drop any artist owned by the e2e-artist profile so the next claim/create can succeed.
            await sql`
                DELETE FROM artists
                WHERE profile_id IN (
                    SELECT p.id FROM profiles p
                    JOIN auth.users u ON u.id = p.user_id
                    WHERE u.email = ${'e2e-artist@agendaclubber.com'}
                )
            `;
            // Remove any artist created on-the-fly during a previous test run.
            await sql`DELETE FROM artists WHERE artistic_name IN (${'Artista Ghost XYZ'}, ${'Artista Inexistente XYZ'})`;
            // Reset the orphan seed in case a previous test claimed it.
            await sql`
                INSERT INTO artists (artistic_name, slug, location, genre_primary, profile_id, status, is_verified, privacy_settings)
                VALUES (${'Test DJ'}, ${'test-dj'}, ${'São Paulo, SP'}, ${'Techno'}, NULL, ${'approved'}, false, ${sql.json(DEFAULT_PRIVACY)})
                ON CONFLICT (artistic_name) DO UPDATE
                  SET slug = 'test-dj',
                      profile_id = NULL,
                      status = 'approved'
            `;
        } finally {
            await sql.end({ timeout: 5 });
        }

        await page.goto('/onboarding/artist');
    });

    test('busca por artista existente sem dono → exibe card restricted com CTA de claim', async ({ page }) => {
        // Step 1: Search screen visible
        await expect(page.locator('text=Buscando seu perfil')).toBeVisible();

        // Enter the seed artist name and search
        await page.getByPlaceholder('Digite o nome artístico...').fill('Test DJ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Step 2: Claim screen — shows ArtistIdentityCard with restricted badge
        await expect(page.locator('text=Encontramos um perfil com este nome')).toBeVisible();
        await expect(page.locator('text=Restricted')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Reivindicar Perfil' })).toBeVisible();

        // Secondary CTA to create new should also be visible
        await expect(page.locator('text=Não sou eu, criar novo perfil')).toBeVisible();
    });

    test('claim flow completo → redirect para dashboard com banner pending', async ({ page }) => {
        // Search
        await page.getByPlaceholder('Digite o nome artístico...').fill('Test DJ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Wait for claim form to appear
        await expect(page.getByRole('button', { name: 'Reivindicar Perfil' })).toBeVisible();

        // Fill required form fields
        await page.locator('input#genrePrimary').fill('Techno');
        await page.locator('textarea#bio').fill('Bio de teste para claim.');

        // Select Public privacy (default)
        await page.locator('label[for="privacy-public"]').click();

        // Submit
        await page.getByRole('button', { name: 'Reivindicar Perfil' }).click();

        // Should redirect to /dashboard/artist with pending banner
        await expect(page).toHaveURL('/dashboard/artist');
        await expect(page.locator('text=Perfil aguardando aprovação')).toBeVisible();
    });

    test('clicar "Não sou eu" avança para criar novo perfil', async ({ page }) => {
        await page.getByPlaceholder('Digite o nome artístico...').fill('Test DJ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        await expect(page.locator('text=Não sou eu, criar novo perfil')).toBeVisible();
        await page.locator('text=Não sou eu, criar novo perfil').click();

        // Should show create form
        await expect(page.locator('text=Complete seu Perfil')).toBeVisible();
    });

    test('busca por nome inexistente → avança direto para criar novo perfil', async ({ page }) => {
        await page.getByPlaceholder('Digite o nome artístico...').fill('Artista Inexistente XYZ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Should go directly to create form
        await expect(page.locator('text=Complete seu Perfil')).toBeVisible();
        await expect(page.locator('input#artisticName')).toHaveValue('Artista Inexistente XYZ');
    });

    test('create flow com Ghost Mode → redirect para dashboard com banner pending', async ({ page }) => {
        await page.getByPlaceholder('Digite o nome artístico...').fill('Artista Ghost XYZ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        await expect(page.locator('text=Complete seu Perfil')).toBeVisible();

        // Fill form
        await page.locator('input#location').fill('Belo Horizonte, MG');
        await page.locator('input#genrePrimary').fill('Techno');

        // Select Ghost Mode
        await page.locator('label[for="privacy-ghost"]').click();

        await page.getByRole('button', { name: 'Finalizar Onboarding' }).click();

        await expect(page).toHaveURL('/dashboard/artist');
        await expect(page.locator('text=Perfil aguardando aprovação')).toBeVisible();
    });

    test('busca por nome já reivindicado → exibe erro de duplicata', async ({ page }) => {
        // This requires a seed artist with profile_id != NULL (already claimed)
        // Seed name: 'Already Claimed DJ'
        await page.getByPlaceholder('Digite o nome artístico...').fill('Already Claimed DJ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        await expect(page.locator('text=Já existe um artista com este nome cadastrado')).toBeVisible();
    });
});
