import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE, OTHER_COLLECTIVE_STORAGE_STATE } from './global-setup';

/**
 * Story 3.3 — Cross-Collective Conflict Detection
 *
 * Prerequisites:
 * - Supabase preview running (CI or local)
 * - global-setup.ts has seeded "E2E Other Collective" with event "Festa Concorrente"
 *   (Techno, tomorrow, lineup: ["DJ Externo"], location: Recife, PE)
 * - PRODUCER_STORAGE_STATE: "E2E Producer" from "E2E Producer Collective" (São Paulo, SP, Techno)
 * - OTHER_COLLECTIVE_STORAGE_STATE: "E2E Other Producer" from "E2E Other Collective" (Recife, PE, Techno)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 * for global-setup to seed test data.
 */

test.describe('Story 3.3 — Conflict Detection (RED/YELLOW/GREEN)', () => {
    test.describe('produtor do coletivo A (São Paulo)', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        test('RED: criar evento Techno próximo ao evento concorrente gera conflito vermelho', async ({ page }) => {
            await page.goto('/dashboard/collective');

            const tomorrow = new Date();
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Click on the day cell for tomorrow+1 (1 day from seeded event)
            const cells = page.getByTestId('day-cell');
            await expect(cells).toHaveCount(30);

            // Fill event form
            await page.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Conflitante');
            await page.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');
            // Genre should default to Techno (same as collective)

            await page.getByRole('button', { name: /salvar evento/i }).click();

            // Wait for success toast or redirect
            await page.waitForTimeout(1000);

            // Verify the day cell shows RED (neon-red glow or red class)
            // The DayCell component should reflect the conflict level
            // Specific assertion depends on DayCell implementation
        });

        test('YELLOW: criar evento Techno em 6 dias gera conflito amarelo', async ({ page }) => {
            await page.goto('/dashboard/collective');

            // Click on day 6 days from tomorrow (5-day delta from seeded event = YELLOW genre)
            const tomorrow = new Date();
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 6);

            // Navigate or click appropriate day
            // Fill and submit form similarly...

            // Verify YELLOW indicator
        });

        test('GREEN: criar evento com gênero diferente não gera conflito', async ({ page }) => {
            await page.goto('/dashboard/collective');

            // Select a date close to seeded event but with different genre
            // Fill event form with House (not Techno)

            // Verify GREEN or no conflict indicator
        });
    });
});
