import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/operations-e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5181',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'operations-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'operations-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npx vite apps/web --host 127.0.0.1 --port 5181 --strictPort',
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: false,
    // Synthetic browser exceptions are intentionally triggered, never retained.
    stdout: 'ignore',
    stderr: 'ignore',
    env: {
      VITE_SENTRY_DSN: 'https://123abc@o1.ingest.us.sentry.io/123',
      VITE_PII_RELEASE: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      VITE_PII_ENVIRONMENT: 'local',
    },
  },
});
