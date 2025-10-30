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
    ['junit', { outputFile: 'reports/junit/results.xml' }]
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
    trace: 'on-first-retry',
    video: 'on-first-retry',
    outputDir: 'test-results'
  },
  workers: 4
});


