import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

/**
 * E2E tests for Story 2.4: Public Adaptive Profile + SEO.
 *
 * Seeds (created in global-setup.ts):
 *  - 'test-dj'       → approved, mode=public, bio='Bio do Test DJ', genre='Techno'
 *  - 'ghost-dj'      → approved, mode=ghost  → 404 for everyone
 *  - 'pending-dj'    → pending_approval       → 404 for everyone
 *  - 'collectives-dj'→ approved, mode=collectives_only, bio='Bio secreta...'
 */

test.describe('Public Artist Profile — anon visitor', () => {
    test('renders public profile with name, location, bio and genre', async ({ page }) => {
        await page.goto('/artists/test-dj');

        await expect(page).not.toHaveURL(/404/);
        await expect(page.getByRole('heading', { name: 'Test DJ' })).toBeVisible();
        await expect(page.getByText('São Paulo, SP')).toBeVisible();
        await expect(page.getByText('Techno')).toBeVisible();
        await expect(page.getByText('Bio do Test DJ')).toBeVisible();
    });

    test('includes SEO meta title in HTML', async ({ page }) => {
        await page.goto('/artists/test-dj');

        const title = await page.title();
        expect(title).toContain('Test DJ');
        expect(title).toContain('Agenda Clubber');
    });

    test('includes SEO meta description in HTML', async ({ page }) => {
        await page.goto('/artists/test-dj');

        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
    });

    test('ghost-dj returns 404', async ({ page }) => {
        const response = await page.goto('/artists/ghost-dj');
        expect(response?.status()).toBe(404);
    });

    test('pending-dj returns 404', async ({ page }) => {
        const response = await page.goto('/artists/pending-dj');
        expect(response?.status()).toBe(404);
    });

    test('unknown slug returns 404', async ({ page }) => {
        const response = await page.goto('/artists/artista-que-nao-existe-xyzabc');
        expect(response?.status()).toBe(404);
    });

    test('collectives_only profile: name and location visible, bio hidden', async ({ page }) => {
        await page.goto('/artists/collectives-dj');

        await expect(page.getByRole('heading', { name: 'Collectives DJ' })).toBeVisible();
        await expect(page.getByText('Recife, PE')).toBeVisible();
        await expect(page.getByText('Bio secreta do Collectives DJ')).not.toBeVisible();
    });
});

test.describe('Public Artist Profile — produtor (Collectives Only)', () => {
    test.use({ storageState: PRODUCER_STORAGE_STATE });

    test('produtor sees collectives_only bio', async ({ page }) => {
        await page.goto('/artists/collectives-dj');

        await expect(page.getByRole('heading', { name: 'Collectives DJ' })).toBeVisible();
        await expect(page.getByText('Bio secreta do Collectives DJ')).toBeVisible();
    });

    test('produtor still gets 404 on ghost profile', async ({ page }) => {
        const response = await page.goto('/artists/ghost-dj');
        expect(response?.status()).toBe(404);
    });
});
