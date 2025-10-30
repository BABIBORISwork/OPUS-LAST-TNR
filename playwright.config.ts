import { defineConfig } from '@playwright/test';
import { config } from './src/config';

export default defineConfig({
  testDir: 'src/tests',
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.tspec.ts'
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    launchOptions: { slowMo: config.slowMo },
    navigationTimeout: config.timeoutMs,
    actionTimeout: config.timeoutMs,
    screenshot: 'only-on-failure',
    trace: 'on'
  },
  timeout: config.timeoutMs * 2,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'always' }]],
  workers: 4
});


