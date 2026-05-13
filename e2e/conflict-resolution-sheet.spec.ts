import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

/**
 * Story 4.1 — Conflict Resolution Sheet (Painel Lateral)
 *
 * Prerequisites:
 * - Supabase preview running (CI or local)
 * - global-setup.ts seeds "E2E Producer Collective" with events
 * - Requires events with conflictLevel RED and YELLOW visible on the calendar grid
 */

test.describe('Story 4.1 — Conflict Resolution Sheet', () => {
    test.describe.configure({ retries: 0 });
    test.describe('produtor do coletivo E2E', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        test('ATDD-4.1-06: RED conflict badge click opens conflict resolution sheet with WhatsApp button', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            // Find a day cell with a RED conflict event
            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const badgeButton = sheet.locator('button[aria-label*="Ver detalhes do conflito"]');
                    const badgeCount = await badgeButton.count();
                    if (badgeCount > 0) {
                        const label = await badgeButton.first().getAttribute('aria-label');
                        if (label?.includes('Vermelho')) {
                            found = true;
                            await badgeButton.first().click();

                            // Look for the conflict resolution sheet content
                            const waLink = page.getByRole('link', { name: /Chamar no WhatsApp/i });
                            await expect(waLink.first()).toBeVisible({ timeout: 5000 });
                            break;
                        }
                    }
                }
            }
            expect(found).toBe(true);
        });

        test('ATDD-4.1-12: YELLOW conflict with masked event shows "Em Planejamento"', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const badgeButton = sheet.locator('button[aria-label*="Ver detalhes do conflito"]');
                    const badgeCount = await badgeButton.count();
                    if (badgeCount > 0) {
                        const label = await badgeButton.first().getAttribute('aria-label');
                        if (label?.includes('Amarelo')) {
                            found = true;
                            await badgeButton.first().click();

                            // Check for privacy-masked content
                            await expect(page.getByText('Em Planejamento').first()).toBeVisible({ timeout: 5000 });
                            break;
                        }
                    }
                }
            }
            expect(found).toBe(true);
        });

        test('ATDD-4.1-18: GREEN event badge is not clickable', async ({ page }) => {
            await page.goto('/dashboard/collective');
            await page.waitForTimeout(2000);

            const cells = page.locator('[data-testid="day-cell"]');
            const count = await cells.count();

            let foundGreen = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    // GREEN badges should NOT have the clickable button wrapper
                    // Check that any GREEN conflict indicators are static
                    const greenBadge = sheet.locator('[aria-label*="Conflito Verde"]');
                    const greenCount = await greenBadge.count();

                    if (greenCount > 0) {
                        foundGreen = true;
                        // A GREEN badge should not have a clickable button wrapper
                        // but it should still be rendered as a static indicator
                        await expect(greenBadge.first()).toBeVisible();
                        // The parent should not be a button for GREEN
                        const parentTag = await greenBadge.first().locator('..').evaluate((el) => el.tagName);
                        expect(parentTag).not.toBe('BUTTON');
                        break;
                    }
                }
            }
            // This test is P2 - if no GREEN badge found, we still pass (may not have GREEN events seeded)
            if (!foundGreen) {
                test.skip(true, 'Nenhum evento GREEN encontrado no grid — seed data pode não ter eventos sem conflito');
            }
        });
    });
});
