import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('landing is readable, accessible and does not fetch financial screens', async ({
  page,
}, testInfo) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Passive Income Investing',
  );
  expect(
    scripts.some((url) =>
      /HomeRoute|PortfolioRoute|PlanRoute|FundsRoute|recharts|dummy/.test(url),
    ),
  ).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('landing.png'),
    fullPage: true,
  });
  // 200% text size is a reflow check, not a substitute for manual browser zoom/AT QA.
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(
    page.getByRole('link', { name: 'Explore the demo' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('landing-large-text.png'),
    fullPage: true,
  });
});

test('real routes support refresh, history and active navigation', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/demo/home');
  await expect(
    page.getByRole('heading', { name: 'Demo overview', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Demo notice')).toContainText(
    'Nothing is saved, connected or traded',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include('.site-header')
        .include('.demo-notice')
        .include('.demo-nav')
        .analyze()
    ).violations,
  ).toEqual([]);
  const navigationLinks = page
    .getByRole('navigation', { name: 'Demo navigation' })
    .getByRole('link');
  for (const link of await navigationLinks.all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  const nav = page.getByRole('navigation', { name: 'Demo navigation' });
  await nav.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/portfolio$/);
  await expect(
    nav.getByRole('link', { name: 'Portfolio', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Demo portfolio', exact: true }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'Explore funds' }).click();
  await expect(
    page.getByRole('heading', { name: 'Demo fund catalogue' }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/demo\/portfolio$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/demo\/funds$/);
  await nav.getByRole('link', { name: 'Plan', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Demo income plan' }),
  ).toBeVisible();
  expect(failures).toEqual([]);
});

test('unknown routes and member routes never masquerade as a live portfolio', async ({
  page,
}) => {
  await page.goto('/missing');
  await expect(
    page.getByRole('heading', { name: 'We couldn’t find that page' }),
  ).toBeVisible();
  await page.goto('/demo/missing');
  await expect(
    page.getByRole('heading', { name: 'We couldn’t find that page' }),
  ).toBeVisible();
  await page.goto('/app/portfolio');
  await expect(
    page.getByRole('heading', { name: 'Member access is not configured' }),
  ).toBeVisible();
  await expect(page.getByLabel('Demo navigation')).toHaveCount(0);
  await expect(page.getByText('Demo portfolio', { exact: true })).toHaveCount(
    0,
  );
});

test('a failed lazy route has an honest recoverable error screen', async ({
  page,
}) => {
  await page.route('**/assets/HomeRoute-*.js', (route) =>
    route.fulfill({
      status: 503,
      body: '',
      headers: { 'Cache-Control': 'no-store' },
    }),
  );
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore the demo' }).click();
  await expect(
    page.getByRole('heading', { name: 'This page couldn’t load' }),
  ).toBeVisible();
  await page.unroute('**/assets/HomeRoute-*.js');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Demo overview', exact: true }),
  ).toBeVisible();
});

test('redirects use canonical URLs', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/demo\/home$/);
  await page.goto('/demo/discover');
  await expect(page).toHaveURL(/\/demo\/funds$/);
  await expect(
    page.getByRole('heading', { name: 'Demo fund catalogue' }),
  ).toBeVisible();
});

test('every demo screen supports a direct link and refresh', async ({
  page,
}) => {
  for (const [path, heading] of [
    ['home', 'Demo overview'],
    ['portfolio', 'Demo portfolio'],
    ['funds', 'Demo fund catalogue'],
    ['plan', 'Demo income plan'],
  ] as const) {
    await page.goto(`/demo/${path}`);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
});

test('keyboard navigation skips the header and focuses route content', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop keyboard journey',
  );
  await page.goto('/');
  // Explicit focus starts the keyboard journey independent of browser autofocus.
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Explore the demo' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Demo overview', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .include('.site-header')
        .include('.demo-notice')
        .include('.demo-nav')
        .analyze()
    ).violations,
  ).toEqual([]);
});
