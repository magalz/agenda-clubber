import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

test.describe('Story 3.2 — Event Registration', () => {
    test.use({ storageState: PRODUCER_STORAGE_STATE });

    test('opens Sheet with event form on day cell click', async ({ page }) => {
        await page.goto('/dashboard/collective');

        const cells = page.getByTestId('day-cell');
        await expect(cells).toHaveCount(30);

        await cells.first().click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await expect(dialog.getByRole('textbox', { name: /nome do evento/i })).toBeVisible();
        await expect(dialog.getByRole('textbox', { name: /local do evento/i })).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Salvar evento' })).toBeVisible();
    });

    test('submits event successfully', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.getByTestId('day-cell').first().click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('E2E Test Event');
        await dialog.getByRole('textbox', { name: /local do evento/i }).fill('D-Edge, São Paulo');

        const genreTrigger = dialog.getByRole('combobox');
        await genreTrigger.click();
        await page.getByRole('option', { name: 'Techno' }).click();

        await dialog.getByRole('button', { name: 'Salvar evento' }).click();

        await expect(page.getByText(/Evento criado|evento criado/)).toBeVisible({ timeout: 10000 });

        await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
});
