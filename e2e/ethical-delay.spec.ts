import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

test.describe('Story 3.5 — Ethical Delay Component', () => {
    test.describe('produtor do coletivo E2E', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        // Cancel test runs BEFORE confirm test — both use the same "Evento Delay Ético" seed event.
        // Cancel confirms first (countdown starts), then cancels → event stays planning.
        // Confirm test then confirms fully → event becomes confirmed.
        test('RED: Cancelar no meio do countdown mantém evento em planejamento', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(200);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const content = await sheet.textContent();
                    if (content?.includes('Evento Delay Ético')) {
                        found = true;

                        const confirmBtn = sheet.getByRole('button', { name: /confirmar evento/i }).first();
                        await confirmBtn.click();

                        const ethicalDialog = page.locator('[role="alertdialog"]');
                        await expect(ethicalDialog).toBeVisible({ timeout: 3000 });

                        await page.waitForTimeout(1000);

                        const cancelBtn = ethicalDialog.getByRole('button', { name: /cancelar/i });
                        await cancelBtn.click();

                        await expect(ethicalDialog).not.toBeVisible({ timeout: 2000 });

                        const planningBadge = sheet.getByText('Em Planejamento');
                        await expect(planningBadge).toBeVisible();
                        break;
                    }
                }
            }
            expect(found).toBe(true);
        });

        test('RED: EthicalDelayButton aparece e confirma evento após 3s', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(200);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const content = await sheet.textContent();
                    if (content?.includes('Evento Delay Ético')) {
                        found = true;

                        const confirmBtn = sheet.getByRole('button', { name: /confirmar evento/i }).first();
                        await expect(confirmBtn).toBeVisible();

                        await confirmBtn.click();

                        const ethicalDialog = page.locator('[role="alertdialog"]');
                        await expect(ethicalDialog).toBeVisible({ timeout: 3000 });
                        await expect(ethicalDialog).toContainText('Confirmar evento mesmo com conflitos críticos?');

                        await page.waitForTimeout(3500);

                        await expect(ethicalDialog).not.toBeVisible({ timeout: 2000 });

                        const statusBadge = sheet.getByText('Confirmado');
                        await expect(statusBadge).toBeVisible({ timeout: 3000 });
                        break;
                    }
                }
            }
            expect(found).toBe(true);
        });

        test('GREEN: confirmação instantânea sem dialog de delay', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(200);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const content = await sheet.textContent();
                    if (content?.includes('Evento Sem Conflito')) {
                        found = true;

                        const confirmBtn = page.getByRole('listitem').filter({ hasText: 'Evento Sem Conflito' }).getByRole('button', { name: /confirmar evento/i });
                        await expect(confirmBtn).toBeVisible();

                        const ethicalDialog = page.locator('[role="alertdialog"]');
                        await expect(ethicalDialog).not.toBeVisible({ timeout: 1000 });
                        break;
                    }
                }
            }
            expect(found).toBe(true);
        });
    });
});
