import { test, expect } from '@playwright/test';

// Note: Full command palette flow (Cmd+K → search → results) requires an
// authenticated session with seeded data. These tests cover what is
// verifiable without auth — consistent with the project's E2E approach.
// See auth.spec.ts comment for context on why comprehensive auth flows
// are excluded from the standard pipeline.

test.describe('Command Palette', () => {
  test('dashboard sem autenticação redireciona para login (Command Palette não é exposta)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('onboarding é acessível sem autenticação (fluxo pós-cadastro)', async ({ page }) => {
    // /onboarding/* is intentionally not protected by middleware — users access it
    // right after sign-up before they have a session. CommandPalette is not mounted
    // outside the (dashboard) route group, so it won't be available here.
    await page.goto('/onboarding/artist');
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('página de login não abre Command Palette com Cmd+K', async ({ page }) => {
    await page.goto('/auth/login');
    await page.keyboard.press('Meta+KeyK');
    // Modal não deve aparecer na página de login
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

// To run the full flow locally with auth:
// 1. Log in as a test user and export Playwright storage state
// 2. Seed at least 1 verified artist + 1 restricted + 1 active collective
// 3. Use storageState in playwright.config.ts for the authenticated project
//
// Expected flow:
//   page.goto('/dashboard')
//   page.keyboard.press('Meta+KeyK')     → modal opens
//   page.fill('[cmdk-input]', 'rock')    → results appear
//   expect artist card to be visible     → ArtistIdentityCard rendered
//   page.keyboard.press('Escape')        → modal closes
