import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
        await page.goto('/dashboard');
        // Ensure the middleware caught it and redirected us
        await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test('redirects unauthenticated users to login from admin', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    // Note: Since E2E tests target a local running instance without mocked Database logic,
    // comprehensive authentication flows (successful login, role-based checks) 
    // require active seeding or use of test profiles which may not exist during regular pipeline.
    // We'll perform basic validation of the UI elements here.

    test('login page has correct UI elements', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.locator('text=Entrar')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: "Entrar" })).toBeVisible();
    });
});
