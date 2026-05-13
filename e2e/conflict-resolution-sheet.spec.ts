import { test, expect } from '@playwright/test';
import { PRODUCER_STORAGE_STATE } from './global-setup';

/**
 * Story 4.1 — Conflict Resolution Sheet (Painel Lateral)
 *
 * Prerequisites:
 * - Supabase preview running (CI or local)
 * - global-setup.ts seeds:
 *   - "Evento Delay Ético" (RED, today+4) + event_conflicts pair → RED test
 *   - "Evento Amarelo" (YELLOW, today+7) + event_conflicts pair → YELLOW test
 *   - "Festa Concorrente" (Other Collective, privacy=false) → masked event in sheet
 */

test.describe('Story 4.1 — Conflict Resolution Sheet', () => {
    test.describe.configure({ retries: 0 });
    test.describe('produtor do coletivo E2E', () => {
        test.use({ storageState: PRODUCER_STORAGE_STATE });

        test('ATDD-4.1-06: RED conflict badge click opens conflict resolution sheet with WhatsApp button', async ({ page }) => {
            await page.goto('/dashboard/collective');

            const cells = page.locator('[data-testid="day-cell"]');
            await expect(cells.first()).toBeVisible({ timeout: 10000 });
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const hasConflict = await sheet.getByText('Evento Delay Ético').isVisible().catch(() => false);
                    if (hasConflict) {
                        const badgeButton = sheet.locator('button[aria-label*="Ver detalhes do conflito"]');
                        const badgeCount = await badgeButton.count();
                        if (badgeCount > 0) {
                            found = true;
                            await badgeButton.first().click();

                            const conflictSheet = page.getByRole('dialog');
                            const waLink = conflictSheet.getByRole('link', { name: /Chamar no WhatsApp/i });
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

            const cells = page.locator('[data-testid="day-cell"]');
            await expect(cells.first()).toBeVisible({ timeout: 10000 });
            const count = await cells.count();

            let found = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const hasYellow = await sheet.getByText('Evento Amarelo').isVisible().catch(() => false);
                    if (hasYellow) {
                        const badgeButton = sheet.locator('button[aria-label*="Ver detalhes do conflito"]');
                        const badgeCount = await badgeButton.count();
                        if (badgeCount > 0) {
                            found = true;
                            await badgeButton.first().click();

                            const conflictSheet = page.getByRole('dialog');
                            // Verify ConflictResolutionSheet opened (unique title)
                            await expect(conflictSheet.getByText('Resolução de Conflito').first()).toBeVisible({ timeout: 5000 });
                            // Verify privacy-masked event name
                            await expect(conflictSheet.getByText('Em Planejamento').first()).toBeVisible({ timeout: 5000 });
                            break;
                        }
                    }
                }
            }
            expect(found).toBe(true);
        });

        test('ATDD-4.1-18: GREEN event badge is not clickable', async ({ page }) => {
            await page.goto('/dashboard/collective');

            const cells = page.locator('[data-testid="day-cell"]');
            await expect(cells.first()).toBeVisible({ timeout: 10000 });
            const count = await cells.count();

            let foundGreen = false;
            for (let i = 0; i < count; i++) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
                await cells.nth(i).click();

                const sheet = page.getByRole('dialog');
                const isVisible = await sheet.isVisible().catch(() => false);
                if (isVisible) {
                    const greenBadge = sheet.locator('[aria-label*="Conflito Verde"]');
                    const greenCount = await greenBadge.count();

                    if (greenCount > 0) {
                        foundGreen = true;
                        await expect(greenBadge.first()).toBeVisible();

                        const parentTag = await greenBadge.first().locator('..').evaluate((el) => el.tagName);
                        expect(parentTag).not.toBe('BUTTON');
                        break;
                    }
                }
            }

            if (!foundGreen) {
                test.skip(true, 'Nenhum evento GREEN encontrado no grid — seed pode não ter eventos sem conflito');
            }
        });
    });
});
