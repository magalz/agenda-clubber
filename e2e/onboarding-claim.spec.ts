import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Claim flow introduced in Story 2.3.
 *
 * Pre-condition: a seed artist with artistic_name='Test DJ', profile_id IS NULL,
 * status='approved' must exist in the database before these tests run.
 * The seed is typically created via fixture SQL or a seed migration in the test environment.
 *
 * These tests verify the full 3-step onboarding state machine:
 *   search → claim (if hit) | create (if no hit)
 */

test.describe('Onboarding Claim Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the artist onboarding page (requires authenticated session)
        // In CI, a test user session cookie is set via global setup
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
        await expect(page.locator('text=Reivindicar Perfil')).toBeVisible();

        // Secondary CTA to create new should also be visible
        await expect(page.locator('text=Não sou eu, criar novo perfil')).toBeVisible();
    });

    test('claim flow completo → redirect para dashboard com banner pending', async ({ page }) => {
        // Search
        await page.getByPlaceholder('Digite o nome artístico...').fill('Test DJ');
        await page.getByRole('button', { name: 'Buscar' }).click();

        // Wait for claim form to appear
        await expect(page.locator('text=Reivindicar Perfil')).toBeVisible();

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
