import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    globalSetup: require.resolve('./e2e/global-setup'),
    globalTimeout: 10 * 60 * 1000,
    reporter: process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }], ['html'], ['json', { outputFile: 'playwright-report/results.json' }]] : 'html',
    webServer: {
        command: 'npm run start',
        port: 3000,
        reuseExistingServer: true,
    },
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
