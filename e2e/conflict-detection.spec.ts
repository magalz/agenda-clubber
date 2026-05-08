import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';
// OTHER_COLLECTIVE_STORAGE_STATE will be used when cross-collective recompute scenario is implemented

/**
 * Story 3.3 — Cross-Collective Conflict Detection
 *
 * Prerequisites:
 * - Supabase preview running (CI or local)
 * - global-setup.ts has seeded "E2E Other Collective" with event "Festa Concorrente"
 *   (Techno, today+1, lineup: ["DJ Externo"], location: Recife, PE)
 * - PRODUCER_STORAGE_STATE: "E2E Producer" from "E2E Producer Collective" (São Paulo, SP, Techno)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 * for global-setup to seed test data.
 */

test.describe('Story 3.3 — Conflict Detection (RED/YELLOW/GREEN)', () => {
    test.describe.configure({ retries: 0 });
    test.describe('produtor do coletivo A (São Paulo)', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        test('RED: criar evento Techno próximo ao evento concorrente gera conflito vermelho', async ({ page }) => {
            await page.goto('/dashboard/collective');

            // Grid: 30 days starting today. Seed event at today+1 (cell index 1).
            // Click today+2 (cell index 2) → 1-day diff → genre RED.
            const cells = page.getByTestId('day-cell');
            await expect(cells).toHaveCount(30);

            await cells.nth(2).click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Conflitante');
            await dialog.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');

            // Select Techno (same as seed event → genre conflict)
            await dialog.getByRole('combobox', { name: /genero musical/i }).dispatchEvent('click');
            await page.getByRole('option', { name: 'Techno', exact: true }).click();
            await page.waitForTimeout(300);

            // Submit via dispatchEvent (bypasses CI viewport scroll issues)
            const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
            await expect(submitBtn).toBeEnabled();
            await submitBtn.dispatchEvent('click');

            // Confirm server action completed
            const toast = page.locator('[data-sonner-toast]');
            await expect(toast.first()).toBeVisible({ timeout: 20000 });

            // Reload to pick up conflict evaluation results from health pulse
            await page.reload();
            await page.waitForTimeout(500);

            const updatedCells = page.getByTestId('day-cell');
            await expect(updatedCells).toHaveCount(30);

            // Cell index 2 should now show RED (genre conflict, 1-day window)
            await expect(updatedCells.nth(2)).toHaveAttribute('aria-label', /alto risco de conflito/);
        });

        test('YELLOW: criar evento Techno em 6 dias gera conflito amarelo', async ({ page }) => {
            await page.goto('/dashboard/collective');
            const cells = page.getByTestId('day-cell');
            await expect(cells).toHaveCount(30);

            // Seed event at today+1. Click today+6 → 5-day delta → YELLOW genre.
            await cells.nth(6).click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Amarela');
            await dialog.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');

            await dialog.getByRole('combobox', { name: /genero musical/i }).dispatchEvent('click');
            await page.getByRole('option', { name: 'Techno', exact: true }).click();
            await page.waitForTimeout(300);

            const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
            await expect(submitBtn).toBeEnabled();
            await submitBtn.dispatchEvent('click');

            const toast = page.locator('[data-sonner-toast]');
            await expect(toast.first()).toBeVisible({ timeout: 30000 });

            await page.reload();
            await page.waitForTimeout(500);

            const updatedCells = page.getByTestId('day-cell');
            await expect(updatedCells).toHaveCount(30);

            // Cell index 6 should show YELLOW (genre conflict, 5-day window → yellow)
            await expect(updatedCells.nth(6)).toHaveAttribute('aria-label', /médio risco de conflito/);
        });

        test('GREEN: criar evento com gênero diferente não gera conflito', async ({ page }) => {
            await page.goto('/dashboard/collective');
            const cells = page.getByTestId('day-cell');
            await expect(cells).toHaveCount(30);

            // Use cell 15 — far from seed (index 1), RED test (index 2), and YELLOW test (index 6)
            await cells.nth(15).click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();

            await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('Festa Verde');
            await dialog.getByRole('textbox', { name: /local do evento/i }).fill('São Paulo, SP');

            // Select House (different from seed's Techno)
            await dialog.getByRole('combobox', { name: /genero musical/i }).dispatchEvent('click');
            await page.getByRole('option', { name: 'House', exact: true }).click();
            await page.waitForTimeout(300);

            const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
            await expect(submitBtn).toBeEnabled();
            await submitBtn.dispatchEvent('click');

            const toast = page.locator('[data-sonner-toast]');
            await expect(toast.first()).toBeVisible({ timeout: 30000 });

            await page.reload();
            await page.waitForTimeout(500);

            const updatedCells = page.getByTestId('day-cell');
            await expect(updatedCells).toHaveCount(30);

            // Cell index 15 should NOT have any conflict — House ≠ seed's Techno, far window
            await expect(updatedCells.nth(15)).not.toHaveAttribute('aria-label', /risco de conflito/);
        });
    });
});
