import { test, expect } from '@playwright/test';

test.describe('Agenda Clubber Smoke Test', () => {
  test('should load the homepage and show core UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for App Name
    await expect(page.locator('h1')).toContainText('agenda-clubber');
    
    // Verify System Status block exists
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('Database:')).toBeVisible();
    await expect(page.getByText('Auth Engine:')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    // Check if Login button exists (for unauthenticated state)
    const loginBtn = page.getByRole('link', { name: 'Login' });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('h1')).toContainText('Login');
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');
    const signupBtn = page.getByRole('link', { name: 'Sign Up' });
    if (await signupBtn.isVisible()) {
      await signupBtn.click();
      await expect(page).toHaveURL(/.*signup/);
      await expect(page.locator('h1')).toContainText('Cadastro');
    }
  });

  test('should protect dashboard routes', async ({ page }) => {
    // Attempt to go to events directly without auth
    await page.goto('/dashboard/events');
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should protect calendar routes', async ({ page }) => {
    // Attempt to go to calendar directly without auth
    await page.goto('/dashboard/calendar');
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});
