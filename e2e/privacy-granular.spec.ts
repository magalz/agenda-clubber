import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

test.describe('Cross-collective privacy granular', () => {
    test.use({ storageState: PRODUCER_STORAGE_STATE });

    test('event from other collective in planning shows only genre + placeholder', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.waitForTimeout(2000);

        const cells = page.locator('[role="grid"] [role="gridcell"], [data-testid="day-cell"]');
        const count = await cells.count();

        for (let i = 0; i < count; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            await cells.nth(i).click();

            const sheet = page.locator('[role="dialog"]');
            const isVisible = await sheet.isVisible().catch(() => false);
            if (isVisible) {
                const content = await sheet.textContent();

                if (content?.includes('Festa Concorrente')) {
                    await expect(sheet).not.toContainText('Recife, PE');
                    await expect(sheet).not.toContainText('DJ Externo');
                    await expect(sheet).toContainText('Techno');
                    await expect(sheet).toContainText(/Em Planejamento/i);
                    break;
                }
            }
        }
    });

    test('event from other collective with isNamePublic=true shows name', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.waitForTimeout(2000);

        const cells = page.locator('[role="grid"] [role="gridcell"], [data-testid="day-cell"]');
        const count = await cells.count();

        for (let i = 0; i < count; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            await cells.nth(i).click();

            const sheet = page.locator('[role="dialog"]');
            const isVisible = await sheet.isVisible().catch(() => false);
            if (isVisible) {
                const content = await sheet.textContent();

                if (content?.includes('Evento Nome Visivel')) {
                    await expect(sheet).toContainText('Evento Nome Visivel');
                    await expect(sheet).not.toContainText('Olinda, PE');
                    await expect(sheet).toContainText('House');
                    await expect(sheet).toContainText(/Em Planejamento/i);
                    break;
                }
            }
        }
    });

    test('confirmed event from other collective shows all fields', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.waitForTimeout(2000);

        const cells = page.locator('[role="grid"] [role="gridcell"], [data-testid="day-cell"]');
        const count = await cells.count();

        for (let i = 0; i < count; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            await cells.nth(i).click();

            const sheet = page.locator('[role="dialog"]');
            const isVisible = await sheet.isVisible().catch(() => false);
            if (isVisible) {
                const content = await sheet.textContent();

                if (content?.includes('Festa Confirmada')) {
                    await expect(sheet).toContainText('Festa Confirmada');
                    await expect(sheet).toContainText('Recife Antigo, PE');
                    await expect(sheet).toContainText('Drum and Bass');
                    await expect(sheet).toContainText(/Confirmado/i);
                    break;
                }
            }
        }
    });

    test('other collective events do not show privacy toggles', async ({ page }) => {
        await page.goto('/dashboard/collective');

        await page.waitForTimeout(2000);

        const cells = page.locator('[role="grid"] [role="gridcell"], [data-testid="day-cell"]');
        const count = await cells.count();

        for (let i = 0; i < count; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            await cells.nth(i).click();

            const sheet = page.locator('[role="dialog"]');
            const isVisible = await sheet.isVisible().catch(() => false);
            if (isVisible) {
                const content = await sheet.textContent();

                if (content?.includes('Festa Concorrente') || content?.includes('Evento Nome Visivel') || content?.includes('Festa Confirmada')) {
                    const hasToggle = await sheet.locator('text=Nome público').isVisible().catch(() => false);
                    expect(hasToggle).toBe(false);
                    break;
                }
            }
        }
    });
});
