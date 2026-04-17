import { test, expect } from '@playwright/test';

test.describe('Producer Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/onboarding/producer');
    });

    test('should display 3 onboarding options', async ({ page }) => {
        await expect(page.locator('text=Bem-vindo, Produtor!')).toBeVisible();
        await expect(page.locator('text=Criar um Coletivo/Label')).toBeVisible();
        await expect(page.locator('text=Também sou Artista')).toBeVisible();
        await expect(page.locator('text=Vou aguardar um convite')).toBeVisible();
    });

    test('path B redirects to artist onboarding', async ({ page }) => {
        // Find the "Também sou Artista" link and verify its href
        const artistLink = page.locator('a', { hasText: 'Também sou Artista' });
        await expect(artistLink).toHaveAttribute('href', '/onboarding/artista');
    });

    test('path C shows waiting instructions', async ({ page }) => {
        await page.locator('text=Vou aguardar um convite').click();
        await expect(page.locator('text=Aguarde o Convite')).toBeVisible();
        await expect(page.locator('text=Voltar para Opções')).toBeVisible();

        // Assert we can go back
        await page.locator('button:has-text("Voltar para Opções")').click();
        await expect(page.locator('text=Bem-vindo, Produtor!')).toBeVisible();
    });

    test('path A renders collective creation form', async ({ page }) => {
        await page.locator('text=Criar um Coletivo/Label').click();
        await expect(page.locator('h2:has-text("Criar Coletivo")')).toBeVisible();

        await expect(page.locator('input#name')).toBeVisible();
        await expect(page.locator('input#location')).toBeVisible();
        await expect(page.locator('input#genrePrimary')).toBeVisible();
        await expect(page.locator('button:has-text("Criar Coletivo")')).toBeVisible();
    });
});
