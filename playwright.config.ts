import { defineConfig } from '@playwright/test';
import { config } from './src/config';

export default defineConfig({
  testDir: 'src/tests',
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.tspec.ts'
  ],
  timeout: config.timeoutMs * 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: true }]
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    launchOptions: { slowMo: config.slowMo },
    navigationTimeout: config.navigationTimeoutMs,
    actionTimeout: config.timeoutMs,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    outputDir: 'test-results'
  },
  globalTeardown: './src/global-teardown.ts',
  workers: 4
});


