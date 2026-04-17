import { test, expect } from '@playwright/test';

test.describe('Artist Onboarding Flow', () => {
    // E2E test for Search Before Create forcing navigation
    test('requires searching for artistic name before filling the form', async ({ page }) => {
        // We navigate to the onboarding page
        await page.goto('/dashboard/onboarding/artist');

        // Verify SearchBeforeCreate is visible first
        await expect(page.locator('text=Buscando seu perfil')).toBeVisible();
        await expect(page.locator('text=Qual é o seu nome artístico?')).toBeVisible();

        // The exact form is not visible yet
        await expect(page.locator('text=Complete seu Perfil')).not.toBeVisible();

        // Input a name and search
        await page.getByPlaceholder('Digite o nome artístico...').fill('DJ Newbie');
        await page.getByRole('button', { name: "Buscar" }).click();

        // After successful search, the form should appear with the name locked
        await expect(page.locator('text=Complete seu Perfil')).toBeVisible();
        await expect(page.locator('input#artisticName')).toHaveValue('DJ Newbie');

        // Assert other required fields are visible
        await expect(page.locator('input#location')).toBeVisible();
        await expect(page.locator('input#genrePrimary')).toBeVisible();
    });
});
