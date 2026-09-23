import { randomUUID, createHmac } from 'node:crypto';
import { once } from 'node:events';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createIdentityHandler } from '@pii/server';
import { profileSchema, onboardingSchema, problemSchema } from '@pii/contracts';
import { apiServer } from '../../scripts/dev-api.ts';
import { admin, pool, config, jwtSecret, asUser } from './local.ts';

const users: { id: string; token: string }[] = [];
const disclosure = `test-${randomUUID()}`;
const server = apiServer(createIdentityHandler(() => config));
let base: string;
let a: { id: string; token: string };
let b: { id: string; token: string };
let staff: { id: string; token: string };
let revoked: { id: string; token: string };

async function api(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
) {
  return fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function rpc(name: string, token: string, args: unknown = {}) {
  return fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
}
async function problem(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toContain('no-store');
  const body = problemSchema.parse(await response.json());
  expect(body.error.request_id).toBe(response.headers.get('x-request-id'));
  return body.error;
}

beforeAll(async () => {
  const existing = await pool.query(
    'select version from private.disclosures where is_current',
  );
  if (existing.rowCount)
    throw new Error(
      'Tests will not replace an existing disclosure. Use a clean disposable local PII database.',
    );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No test server address.');
  base = `http://127.0.0.1:${address.port}`;
  for (let index = 0; index < 4; index++) {
    const email = `pii-${randomUUID()}@example.test`;
    const password = `Test-only-${randomUUID()}`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', is_admin: true },
    });
    if (created.error || !created.data.user)
      throw new Error('Failed to create synthetic Auth identity.');
    // Track before signing in so cleanup also covers a partially failed setup.
    const user = { id: created.data.user.id, token: '' };
    users.push(user);
    const client = createClient(config.supabaseUrl, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session)
      throw new Error('Local Auth sign-in failed.');
    user.token = signed.data.session.access_token;
  }
  [a, b, staff, revoked] = users as [
    typeof a,
    typeof b,
    typeof staff,
    typeof revoked,
  ];
});

afterAll(async () => {
  for (const user of users) {
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error)
      throw new Error('Synthetic Auth identity cleanup failed.');
  }
  await pool.query('delete from private.disclosures where version = $1', [
    disclosure,
  ]);
  await pool.query(
    'delete from private.staff_audit where subject_user_id = any($1::uuid[])',
    [users.map((user) => user.id)],
  );
  await pool.end();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe('real Auth → HTTP API → user-context RPC → Postgres', () => {
  it('keeps grants and execution privileges narrow after migration replay', async () => {
    expect(
      (
        await pool.query(
          "select tablename from pg_tables where schemaname = 'private' and not rowsecurity",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await pool.query(
          "select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'identity_%' and p.prosecdef",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await pool.query(
          "select rolname from pg_roles where rolname in ('anon', 'authenticated') and (rolcanlogin or rolbypassrls)",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await pool.query(
          "select has_schema_privilege('authenticated', 'public', 'CREATE') allowed",
        )
      ).rows,
    ).toEqual([{ allowed: false }]);
    expect(
      (
        await pool.query(
          "select has_function_privilege('anon', 'public.identity_initialize()', 'EXECUTE') allowed",
        )
      ).rows,
    ).toEqual([{ allowed: false }]);
    const db = await pool.connect();
    try {
      await db.query('begin');
      await db.query('set local role anon');
      await expect(
        db.query('select * from private.profiles'),
      ).rejects.toMatchObject({ code: '42501' });
    } finally {
      await db.query('rollback');
      db.release();
    }
  });
  it('rejects anonymous, forged and expired tokens', async () => {
    await problem(await api('/me'), 401);
    const forged = a.token.slice(0, -16) + 'AAAAAAAAAAAAAAAA';
    await problem(await api('/me', forged), 401);
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const part = a.token.split('.')[1];
    if (!part) throw new Error('Missing test token claims.');
    const claims = JSON.parse(
      Buffer.from(part, 'base64url').toString(),
    ) as Record<string, unknown>;
    const body = Buffer.from(JSON.stringify({ ...claims, exp: 1 })).toString(
      'base64url',
    );
    const signature = createHmac('sha256', jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    await problem(await api('/me', `${header}.${body}.${signature}`), 401);
  });

  it('initializes exactly one owned profile/onboarding pair under duplicate requests', async () => {
    await problem(await api('/me', a.token), 404);
    const responses = await Promise.all([
      api('/me', a.token, 'POST', {}),
      api('/me', a.token, 'POST', {}),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(profileSchema.parse(await response.json())).toMatchObject({
        user_id: a.id,
        revision: 0,
        display_name: null,
      });
    }
    for (const user of [b, staff, revoked])
      expect((await api('/me', user.token, 'POST', {})).status).toBe(200);
    expect(
      (
        await pool.query(
          'select count(*)::int n from private.profiles where user_id = $1',
          [a.id],
        )
      ).rows,
    ).toEqual([{ n: 1 }]);
    expect(
      (
        await pool.query(
          'select count(*)::int n from private.onboarding where user_id = $1',
          [a.id],
        )
      ).rows,
    ).toEqual([{ n: 1 }]);
  });

  it('persists only allowed profile fields and detects concurrent edits', async () => {
    const response = await api('/me', a.token, 'PATCH', {
      expected_revision: 0,
      display_name: 'Member A',
      country: 'CA',
      display_currency: 'CAD',
    });
    expect(response.status).toBe(200);
    expect(profileSchema.parse(await response.json())).toMatchObject({
      user_id: a.id,
      revision: 1,
      display_name: 'Member A',
    });
    expect(
      profileSchema.parse(await (await api('/me', a.token)).json())
        .display_name,
    ).toBe('Member A');
    const raced = await Promise.all(
      ['First', 'Second'].map((name) =>
        api('/me', a.token, 'PATCH', {
          expected_revision: 1,
          display_name: name,
        }),
      ),
    );
    expect(raced.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(
      profileSchema.parse(await (await api('/me', a.token)).json()).revision,
    ).toBe(2);
    expect(
      profileSchema.parse(await (await api('/me', b.token)).json())
        .display_name,
    ).toBeNull();
  });

  it('rejects owner/role injection through body, query and direct command calls', async () => {
    await problem(await api(`/me?user_id=${b.id}`, a.token), 400);
    for (const extra of [
      { user_id: b.id },
      { role: 'admin' },
      { completed_at: '2026-01-01T00:00:00Z' },
      { display_currency: 'BTC' },
      { display_name: null },
    ]) {
      const patch = {
        expected_revision: 2,
        display_name: 'Injected',
        ...extra,
      };
      await problem(await api('/me', a.token, 'PATCH', patch), 400);
      expect(
        (await rpc('identity_update_profile', a.token, { patch })).status,
      ).toBe(400);
    }
    expect(
      profileSchema.parse(await (await api('/me', a.token)).json()).revision,
    ).toBe(2);
    expect(
      profileSchema.parse(await (await api('/me', b.token)).json()).revision,
    ).toBe(0);
  });

  it('blocks raw Data API access to base tables and private helpers', async () => {
    for (const method of ['GET', 'PATCH']) {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?user_id=eq.${b.id}`,
        {
          method,
          headers: {
            apikey: config.publishableKey,
            Authorization: `Bearer ${a.token}`,
            'Accept-Profile': 'private',
            'Content-Profile': 'private',
            'Content-Type': 'application/json',
          },
          ...(method === 'PATCH'
            ? { body: JSON.stringify({ user_id: a.id, revision: 999 }) }
            : {}),
        },
      );
      expect(response.status).toBe(406);
    }
    expect((await rpc('has_active_session', a.token)).status).toBe(404);
    expect((await rpc('identity_me', '', {})).status).toBeGreaterThanOrEqual(
      400,
    );
  });

  it('proves positive and negative RLS behavior under the actual authenticated role', async () => {
    await asUser(staff.token, async (db) => {
      expect(
        (await db.query('select user_id from private.profiles')).rows,
      ).toEqual([{ user_id: staff.id }]);
    });
    await asUser(a.token, async (db) => {
      expect(
        (
          await db.query(
            'select user_id from private.profiles order by user_id',
          )
        ).rows,
      ).toEqual([{ user_id: a.id }]);
      expect(
        (await db.query('select user_id from private.onboarding')).rows,
      ).toEqual([{ user_id: a.id }]);
      expect(
        (
          await db.query(
            'update private.profiles set display_name = $1 where user_id = $2 returning user_id',
            ['Allowed', a.id],
          )
        ).rows,
      ).toEqual([{ user_id: a.id }]);
      expect(
        (
          await db.query(
            'update private.profiles set display_name = $1 where user_id = $2 returning user_id',
            ['Forbidden', b.id],
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await db.query(
            'update private.onboarding set revision = 99 where user_id = $1 returning user_id',
            [b.id],
          )
        ).rowCount,
      ).toBe(0);
    });
    await expect(
      asUser(a.token, (db) =>
        db.query(
          'update private.profiles set user_id = $1 where user_id = $2',
          [b.id, a.id],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      asUser(a.token, (db) =>
        db.query('insert into private.onboarding(user_id) values ($1)', [b.id]),
      ),
    ).rejects.toMatchObject({ code: '42501' });
    expect(
      profileSchema.parse(await (await api('/me', b.token)).json()).revision,
    ).toBe(0);
  });

  it('requires approved disclosure, valid profile, and server-owned completion fields', async () => {
    await problem(
      await api('/me/onboarding', a.token, 'PATCH', {
        expected_revision: 0,
        action: 'complete',
      }),
      409,
    );
    await pool.query(
      'insert into private.disclosures(version, body, is_current) values ($1, $2, true)',
      [disclosure, 'Synthetic test disclosure. Not approved product wording.'],
    );
    await problem(
      await api('/me/onboarding', a.token, 'PATCH', {
        expected_revision: 0,
        action: 'complete',
      }),
      409,
    );
    expect(
      (
        await rpc('identity_update_onboarding', a.token, {
          patch: {
            expected_revision: 0,
            action: 'complete',
            completed_at: '2020-01-01T00:00:00Z',
          },
        })
      ).status,
    ).toBe(400);
    await problem(
      await api('/me/onboarding', a.token, 'PATCH', {
        expected_revision: 0,
        action: 'acknowledge_disclosure',
        disclosure_version: 'obsolete',
      }),
      409,
    );
    const acknowledgment = await api('/me/onboarding', a.token, 'PATCH', {
      expected_revision: 0,
      action: 'acknowledge_disclosure',
      disclosure_version: disclosure,
    });
    expect(acknowledgment.status).toBe(200);
    expect(
      onboardingSchema.parse(await acknowledgment.json()).state,
    ).toMatchObject({
      revision: 1,
      disclosure_version: disclosure,
      completed_at: null,
    });
    const completed = await api('/me/onboarding', a.token, 'PATCH', {
      expected_revision: 1,
      action: 'complete',
    });
    expect(completed.status).toBe(200);
    const result = onboardingSchema.parse(await completed.json());
    expect(result.state.completed_at).not.toBeNull();
    expect(
      onboardingSchema.parse(
        await (
          await api('/me/onboarding', a.token, 'PATCH', {
            expected_revision: 1,
            action: 'complete',
          })
        ).json(),
      ),
    ).toEqual(result);
    expect(
      onboardingSchema.parse(
        await (await api('/me/onboarding', a.token)).json(),
      ),
    ).toEqual(result);
    expect(
      (
        await api('/me/onboarding', b.token, 'PATCH', {
          expected_revision: 0,
          action: 'acknowledge_disclosure',
          disclosure_version: disclosure,
        })
      ).status,
    ).toBe(200);
    await problem(
      await api('/me/onboarding', b.token, 'PATCH', {
        expected_revision: 1,
        action: 'complete',
      }),
      409,
    );
    expect(
      onboardingSchema.parse(
        await (await api('/me/onboarding', b.token)).json(),
      ).state.completed_at,
    ).toBeNull();
  });

  it('ignores editable role metadata, checks current staff membership and audits changes', async () => {
    await problem(await api('/admin/access', staff.token), 403);
    await expect(
      asUser(staff.token, (db) =>
        db.query(
          "insert into private.staff_memberships(user_id, role) values ($1, 'admin')",
          [staff.id],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await pool.query(
      "insert into private.staff_memberships(user_id, role) values ($1, 'admin')",
      [staff.id],
    );
    expect((await api('/admin/access', staff.token)).status).toBe(200);
    await problem(await api('/admin/access', a.token), 403);
    await pool.query(
      'delete from private.staff_memberships where user_id = $1',
      [staff.id],
    );
    await problem(await api('/admin/access', staff.token), 403);
    expect(
      (
        await pool.query(
          'select operation from private.staff_audit where subject_user_id = $1 order by id',
          [staff.id],
        )
      ).rows,
    ).toEqual([{ operation: 'INSERT' }, { operation: 'DELETE' }]);
  });

  it('rejects a signed-out session before its access token expires, including direct RPC', async () => {
    expect((await api('/me', revoked.token)).status).toBe(200);
    const result = await admin.auth.admin.signOut(revoked.token, 'global');
    expect(result.error).toBeNull();
    await problem(await api('/me', revoked.token), 401);
    expect((await rpc('identity_me', revoked.token)).status).toBe(401);
  });
});
