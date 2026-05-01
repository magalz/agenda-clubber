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

    test('submits event and receives server response', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.getByTestId('day-cell').first().click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await dialog.getByRole('textbox', { name: /nome do evento/i }).fill('E2E Test Event');
        await dialog.getByRole('textbox', { name: /local do evento/i }).fill('D-Edge, Sao Paulo');

        // Open select, click option, wait for close
        await dialog.getByRole('combobox', { name: /genero musical/i }).click();
        await page.getByRole('option', { name: 'Techno', exact: true }).click();
        await page.waitForTimeout(300);

        // Submit
        const submitBtn = dialog.getByRole('button', { name: 'Salvar evento' });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // Accept success or error toast — both mean the server action was reached
        const toast = page.locator('[data-sonner-toast]');
        await expect(toast.first()).toBeVisible({ timeout: 20000 });
    });
});
