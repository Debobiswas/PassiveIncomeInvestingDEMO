import { defineConfig, devices } from '@playwright/test';

// Playwright's automatic failure context includes password input values.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

export default defineConfig({
  testDir: './tests/auth-e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  // Auth traces may contain tokens/passwords: never retain or upload them.
  projects: [
    { name: 'auth-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'auth-mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'node scripts/auth-e2e-server.ts',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
  },
});
