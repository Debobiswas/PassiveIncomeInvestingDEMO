import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { admin, pool, config } from '../integration/local';

const emails: string[] = [];
const version = `browser-test-${randomUUID()}`;
const password = `Synthetic-only-${randomUUID()}`;
const mailboxIds = new Set<string>();
function newEmail() {
  const email = `pii-browser-${randomUUID()}@example.test`;
  emails.push(email);
  return email;
}
async function account() {
  const email = newEmail();
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (result.error) throw new Error('Synthetic user creation failed.');
  return email;
}
async function login(page: Page, email: string, pass = password) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(pass);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function profile(page: Page, name: string) {
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  await page.getByLabel('What should we call you?').fill(name);
  await page.getByLabel('Country or region code').fill('CA');
  await page.getByLabel('Preferred display currency').selectOption('CAD');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(
    page.getByRole('heading', { name: 'Before you begin' }),
  ).toBeVisible();
}
async function finish(page: Page) {
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Save acknowledgement' }).click();
  await page.getByRole('button', { name: 'Finish setup' }).click();
}
async function emailLink(email: string, subject: string) {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await fetch('http://127.0.0.1:55424/api/v1/messages');
        const data = (await response.json()) as {
          messages: {
            ID: string;
            Subject: string;
            To: { Address: string }[];
          }[];
        };
        id = data.messages.find(
          (message) =>
            message.To.some((recipient) => recipient.Address === email) &&
            message.Subject.toLowerCase().includes(subject),
        )?.ID;
        return !!id;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  if (!id) throw new Error('Synthetic email not found.');
  mailboxIds.add(id);
  const message = (await (
    await fetch(`http://127.0.0.1:55424/api/v1/message/${id}`)
  ).json()) as { HTML: string };
  const link = message.HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll(
    '&amp;',
    '&',
  );
  if (!link || !link.startsWith('http://127.0.0.1:55421/auth/v1/verify?'))
    throw new Error('Unexpected synthetic email link.');
  return link;
}
test.beforeAll(async () => {
  expect(process.env.PLAYWRIGHT_NO_COPY_PROMPT).toBe('1');
  const current = await pool.query(
    'select version from private.disclosures where is_current',
  );
  if (current.rowCount)
    throw new Error(
      'Refusing to replace an existing current disclosure. Use the disposable local PII stack.',
    );
  await pool.query(
    'insert into private.disclosures(version, body, is_current) values ($1,$2,true)',
    [
      version,
      'SYNTHETIC TEST CONTENT ONLY. This is not an approved educational disclosure.',
    ],
  );
});
test.afterAll(async () => {
  try {
    const users = await pool.query<{ id: string }>(
      'select id from auth.users where email = any($1::text[])',
      [emails],
    );
    for (const user of users.rows) {
      const result = await admin.auth.admin.deleteUser(user.id);
      if (result.error) throw new Error('Synthetic user cleanup failed.');
    }
    await pool.query('delete from private.disclosures where version=$1', [
      version,
    ]);
    // Include this run's emails even if a failure happened before emailLink().
    const inbox = (await (
      await fetch('http://127.0.0.1:55424/api/v1/messages')
    ).json()) as { messages: { ID: string; To: { Address: string }[] }[] };
    for (const message of inbox.messages)
      if (message.To.some((recipient) => emails.includes(recipient.Address)))
        mailboxIds.add(message.ID);
    // Delete only these synthetic messages, never another developer's inbox.
    for (const id of mailboxIds) {
      const deleted = await fetch(`http://127.0.0.1:55424/api/v1/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: [id] }),
      });
      if (!deleted.ok) throw new Error('Synthetic mailbox cleanup failed.');
    }
  } finally {
    await pool.end();
  }
});

test('email confirmation, saved onboarding, reload, second device and logout', async ({
  page,
  browser,
}, info) => {
  const email = newEmail();
  await page.goto('/app/home');
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(
    page.getByRole('heading', { name: 'Create your account' }),
  ).toBeVisible();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Check your email' }),
  ).toBeVisible();
  const link = await emailLink(email, 'confirm');
  const unverified = await page.context().newPage();
  await login(unverified, email);
  await expect(unverified.getByRole('alert')).toContainText(
    'confirm your email',
  );
  await unverified.close();
  await page.goto(link);
  await profile(page, 'Reader One');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Before you begin' }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath('onboarding-synthetic.png'),
    fullPage: true,
  });
  await finish(page);
  await expect(
    page.getByRole('heading', { name: 'Welcome, Reader One' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Welcome, Reader One' }),
  ).toBeVisible();
  const second = await browser.newContext({ baseURL: 'http://127.0.0.1:5180' });
  const other = await second.newPage();
  await login(other, email);
  await expect(
    other.getByRole('heading', { name: 'Welcome, Reader One' }),
  ).toBeVisible();
  await second.close();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Welcome, Reader One' }),
  ).toHaveCount(0);
  await page.goto(link);
  await expect(
    page.getByRole('heading', { name: 'We couldn’t finish signing you in' }),
  ).toBeVisible();
});

test('password recovery uses real local email and returns to sign-in', async ({
  page,
}) => {
  const email = await account();
  await page.goto('/login?mode=reset');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'If an account exists' }),
  ).toBeVisible();
  await page.goto(await emailLink(email, 'reset'));
  await expect(
    page.getByRole('heading', { name: 'Choose a new password' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Choose a new password' }),
  ).toBeVisible();
  const changed = `Changed-test-${randomUUID()}`;
  await page.getByLabel('New password', { exact: true }).fill(changed);
  await page.getByLabel('Confirm new password').fill(changed);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await login(page, email, changed);
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
});

test('invalid credentials, cancelled callback and unsafe return links fail safely', async ({
  page,
}, info) => {
  await page.goto('/login?next=https://evil.test');
  await page.getByLabel('Email address').fill('nonexistent@example.test');
  await page
    .getByLabel('Password', { exact: true })
    .fill('Not-a-real-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('login-large-text.png'),
    fullPage: true,
  });
  await page.goto(
    '/auth/callback?error=access_denied&error_description=PRIVATE_PROVIDER_DETAILS',
  );
  await expect(
    page.getByRole('heading', { name: 'We couldn’t finish signing you in' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await expect(page.locator('body')).not.toContainText(
    'PRIVATE_PROVIDER_DETAILS',
  );
  await page.goto('/auth/callback?code=invalid-test-code');
  await expect(
    page.getByRole('heading', { name: 'We couldn’t finish signing you in' }),
  ).toBeVisible();
});

test('Google starts PKCE and denied consent returns an actionable screen', async ({
  page,
}) => {
  let hasChallenge = false;
  await page.route('**/auth/v1/authorize?**', async (route) => {
    const url = new URL(route.request().url());
    hasChallenge =
      url.searchParams.get('provider') === 'google' &&
      !!url.searchParams.get('code_challenge') &&
      url.searchParams.get('code_challenge_method') === 's256';
    await route.fulfill({
      contentType: 'text/html',
      body: '<script>location.replace("http://127.0.0.1:5180/auth/callback?error=access_denied")</script>',
    });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(
    page.getByRole('heading', { name: 'We couldn’t finish signing you in' }),
  ).toBeVisible();
  expect(hasChallenge).toBe(true);
});

test('offline logout clears this device without claiming server revocation', async ({
  page,
}) => {
  await login(page, await account());
  await profile(page, 'Offline Reader');
  await finish(page);
  await expect(
    page.getByRole('heading', { name: 'Welcome, Offline Reader' }),
  ).toBeVisible();
  await page.route('**/auth/v1/logout?**', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'couldn’t confirm server revocation' }),
  ).toBeVisible();
  await page.reload();
  await page.goto('/app/home');
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Offline Reader');
});

test('account switch and multi-tab logout clear private views and revoke the session', async ({
  page,
  context,
}) => {
  const a = await account();
  const b = await account();
  await login(page, a);
  await profile(page, 'Private Alpha');
  await finish(page);
  await expect(
    page.getByRole('heading', { name: 'Welcome, Private Alpha' }),
  ).toBeVisible();
  const peer = await context.newPage();
  await peer.goto('/app/home');
  await expect(
    peer.getByRole('heading', { name: 'Welcome, Private Alpha' }),
  ).toBeVisible();
  const token = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('pii-auth-127.0.0.1:55421') ?? '{}')
        .access_token as string,
  );
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(
    peer.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'You are signed out.' }),
  ).toBeVisible();
  const revoked = await fetch(`${config.supabaseUrl}/rest/v1/rpc/identity_me`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  expect(revoked.status).toBe(401);
  await login(page, b);
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Private Alpha');
  await expect(page.getByLabel('What should we call you?')).toHaveValue('');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Private Alpha');
});

test('API outage is recoverable and a revoked session clears member data', async ({
  page,
}) => {
  const email = await account();
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'text/html',
      body: 'PRIVATE_UPSTREAM_DETAILS',
    }),
  );
  await login(page, email);
  await expect(
    page.getByRole('heading', { name: 'We couldn’t load your workspace' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    'PRIVATE_UPSTREAM_DETAILS',
  );
  await page.unroute('**/api/v1/me');
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  // Force only the local session cache's expiry; the provider performs an actual
  // refresh grant, and the refreshed token still goes through the real API.
  await page.evaluate(() => {
    const key = 'pii-auth-127.0.0.1:55421';
    const session = JSON.parse(localStorage.getItem(key) ?? '{}');
    session.expires_at = Math.floor(Date.now() / 1000) - 1;
    localStorage.setItem(key, JSON.stringify(session));
  });
  const refreshed = page.waitForResponse((response) =>
    response.url().includes('/auth/v1/token?grant_type=refresh_token'),
  );
  await page.reload();
  expect((await refreshed).status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  const token = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('pii-auth-127.0.0.1:55421') ?? '{}')
        .access_token as string,
  );
  await admin.auth.admin.signOut(token, 'global');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Your session ended' }),
  ).toBeVisible();
});

test('a concurrent profile edit keeps the draft and requires an explicit reload', async ({
  page,
}) => {
  await login(page, await account());
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home' }),
  ).toBeVisible();
  await page.getByLabel('What should we call you?').fill('Local draft');
  await page.getByLabel('Country or region code').fill('CA');
  await page.getByLabel('Preferred display currency').selectOption('CAD');
  const token = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('pii-auth-127.0.0.1:55421') ?? '{}')
        .access_token as string,
  );
  const response = await fetch('http://127.0.0.1:3002/api/v1/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expected_revision: 0,
      display_name: 'Other device',
      country: 'US',
      display_currency: 'USD',
    }),
  });
  expect(response.status).toBe(200);
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'saved information changed',
  );
  await expect(page.getByLabel('What should we call you?')).toHaveValue(
    'Local draft',
  );
  await page.getByRole('button', { name: 'Reload saved information' }).click();
  await expect(page.locator('body')).toContainText('Other device, US, USD');
});

test('missing approved disclosure blocks completion without discarding saved details', async ({
  page,
}) => {
  await pool.query(
    'update private.disclosures set is_current=false where version=$1',
    [version],
  );
  try {
    await login(page, await account());
    await profile(page, 'Waiting Reader');
    await expect(
      page.getByRole('status').filter({ hasText: 'awaiting approval' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Finish setup' }),
    ).toHaveCount(0);
    await page.reload();
    await expect(page.locator('body')).toContainText('Waiting Reader, CA, CAD');
  } finally {
    await pool.query(
      'update private.disclosures set is_current=true where version=$1',
      [version],
    );
  }
});
