import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE, STORAGE_STATE } from './global-setup';

test.describe('Story 3.1 — Calendar Grid (Health Pulse)', () => {
    test.describe('produtor com coletivo ativo', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        test('vê grid de 30 dias e abre Sheet ao clicar', async ({ page }) => {
            await page.goto('/dashboard/collective');

            const cells = page.getByTestId('day-cell');
            await expect(cells).toHaveCount(30);

            await cells.first().click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();
            await expect(dialog).toContainText(/Eventos de \d{1,2} de \w+ de \d{4}/);

            const cta = dialog.getByRole('button', { name: 'Adicionar evento' });
            await expect(cta).toBeDisabled();
        });

        test('fecha o Sheet ao pressionar Escape', async ({ page }) => {
            await page.goto('/dashboard/collective');

            await page.getByTestId('day-cell').first().click();
            await expect(page.getByRole('dialog')).toBeVisible();

            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).not.toBeVisible();
        });
    });

    test.describe('artista puro (sem coletivo)', () => {
        test.use({ storageState: STORAGE_STATE });

        test('vê empty-state, não vê grid', async ({ page }) => {
            await page.goto('/dashboard/collective');

            await expect(page.getByText(/precisa pertencer a um coletivo aprovado/i)).toBeVisible();
            await expect(page.getByTestId('day-cell')).toHaveCount(0);
        });
    });
});
