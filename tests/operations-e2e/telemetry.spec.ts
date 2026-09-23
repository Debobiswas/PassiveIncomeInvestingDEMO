import { expect, test } from '@playwright/test';
import path from 'node:path';

test('development server refuses private map archives', async ({ request }) => {
  const response = await request.get(
    `/@fs/${path.resolve('.private-artifacts/source-maps/local/manifest.json')}`,
  );
  expect(response.status()).toBe(403);
});

test('browser errors are correlated, scrubbed and capped without external transmission', async ({
  page,
  context,
}) => {
  const envelopes: string[] = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:5181') return route.continue();
    if (url.origin === 'https://o1.ingest.us.sentry.io') {
      envelopes.push(route.request().postData() ?? '');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    }
    return route.abort();
  });
  await page.goto('/?code=SECRET_OAUTH_CODE#SECRET_FRAGMENT');
  await expect(page.locator('#root')).not.toBeEmpty();
  await page.evaluate(() => {
    localStorage.setItem('synthetic-auth', 'SECRET_ACCESS_TOKEN');
    console.error('SECRET_HOLDINGS_AND_PROMPT');
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'SECRET_PASSWORD',
        error: new Error('SECRET_PASSWORD'),
      }),
    );
  });
  await expect.poll(() => envelopes.length).toBe(1);
  expect(envelopes.join('')).toContain('browser_failure');
  expect(envelopes.join('')).toContain(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  );
  expect(envelopes.join('')).not.toContain('SECRET_');
  await page.evaluate(() => {
    for (let i = 0; i < 30; i++)
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'SECRET_REPEAT' }),
      );
  });
  await expect.poll(() => envelopes.length).toBe(20);
  expect(envelopes.join('')).not.toContain('SECRET_');
});

test('a failed route emits a safe diagnostic and presents recovery', async ({
  page,
  context,
}) => {
  const envelopes: string[] = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'https://o1.ingest.us.sentry.io') {
      envelopes.push(route.request().postData() ?? '');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    }
    if (url.pathname.includes('/features/auth/Login')) return route.abort();
    if (url.origin === 'http://127.0.0.1:5181') return route.continue();
    return route.abort();
  });
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: 'This page couldn’t load' }),
  ).toBeVisible();
  await expect
    .poll(() => envelopes.some((value) => value.includes('route_failure')))
    .toBe(true);
  expect(envelopes.join('')).not.toContain('Failed to fetch');
});
