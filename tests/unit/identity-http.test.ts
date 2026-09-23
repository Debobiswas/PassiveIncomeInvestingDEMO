import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIdentityHandler } from '@pii/server';
import {
  profilePatchSchema,
  onboardingPatchSchema,
  problemSchema,
} from '@pii/contracts';
import { loadServerConfig } from '../../packages/server/src/config.ts';

const config = {
  supabaseUrl: 'http://127.0.0.1:55421',
  publishableKey: 'sb_publishable_unit_test_only',
};
const actor = '00000000-0000-4000-8000-000000000001';
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature';
const user = {
  id: actor,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  is_anonymous: false,
};
function request(
  method = 'GET',
  body?: string,
  headers: Record<string, string> = {},
) {
  return new Request('http://localhost/api/v1/me', {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body === undefined ? {} : { body }),
  });
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('HTTP request and error boundary', () => {
  it.each([
    ['PATCH', '{'],
    [
      'PATCH',
      JSON.stringify({
        expected_revision: 0,
        user_id: actor,
        display_name: 'Name',
      }),
    ],
    ['PATCH', JSON.stringify({ expected_revision: 0, display_name: null })],
    ['PATCH', JSON.stringify({ expected_revision: -1, display_name: 'Name' })],
    ['POST', JSON.stringify({ role: 'admin' })],
  ])(
    'rejects malformed or overposted %s bodies before upstream work',
    async (method, body) => {
      const upstream = vi.fn<typeof fetch>();
      const response = await createIdentityHandler(
        () => config,
        upstream,
      )(request(method, body));
      expect(response.status).toBe(400);
      expect(upstream).not.toHaveBeenCalled();
    },
  );
  it('enforces a byte limit even without a Content-Length header', async () => {
    const response = await createIdentityHandler(() => config)(
      request('PATCH', JSON.stringify({ display_name: 'é'.repeat(3000) })),
    );
    expect(response.status).toBe(413);
  });
  it('rejects wrong content type, unsupported methods and cross-origin calls', async () => {
    const handle = createIdentityHandler(() => config);
    expect(
      (await handle(request('POST', '{}', { 'Content-Type': 'text/plain' })))
        .status,
    ).toBe(415);
    const denied = await handle(request('DELETE'));
    expect(denied.status).toBe(405);
    expect(denied.headers.get('allow')).toBe('GET, POST, PATCH');
    expect(
      (
        await handle(
          request('GET', undefined, { Origin: 'https://untrusted.example' }),
        )
      ).status,
    ).toBe(403);
  });
  it.each([401, 403, 503])(
    'sanitizes non-JSON upstream failure with status %i',
    async (status) => {
      const upstream: typeof fetch = async (input) =>
        String(input).includes('/auth/v1/user')
          ? Response.json(user)
          : new Response('<html>private-token-and-SQL</html>', {
              status,
              headers: { 'Content-Type': 'text/html' },
            });
      const response = await createIdentityHandler(
        () => config,
        upstream,
      )(request());
      expect(response.status).toBe(status);
      const body = problemSchema.parse(await response.json());
      expect(JSON.stringify(body)).not.toContain('private-token');
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(body.error.request_id).toBe(response.headers.get('x-request-id'));
    },
  );
  it('does not accept an upstream payload with the wrong response shape', async () => {
    const upstream: typeof fetch = async (input) =>
      Response.json(
        String(input).includes('/auth/v1/user') ? user : { data: 'unexpected' },
      );
    expect(
      (await createIdentityHandler(() => config, upstream)(request())).status,
    ).toBe(503);
  });
  it('rejects a valid-looking profile belonging to a different user', async () => {
    const upstream: typeof fetch = async (input) =>
      Response.json(
        String(input).includes('/auth/v1/user')
          ? user
          : {
              user_id: '00000000-0000-4000-8000-000000000002',
              display_name: 'Other member',
              country: 'CA',
              display_currency: 'CAD',
              revision: 0,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
      );
    const response = await createIdentityHandler(
      () => config,
      upstream,
    )(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Other member');
  });
  it('fails closed when Auth is unavailable', async () => {
    const upstream: typeof fetch = async () =>
      new Response('sensitive upstream details', { status: 503 });
    const response = await createIdentityHandler(
      () => config,
      upstream,
    )(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('sensitive');
  });
  it.each([401, 403])(
    'preserves an Auth gateway rejection even when its body is HTML (%i)',
    async (status) => {
      const upstream: typeof fetch = async () =>
        new Response('<html>Private gateway detail</html>', { status });
      const response = await createIdentityHandler(
        () => config,
        upstream,
      )(request());
      expect(response.status).toBe(401);
      expect(await response.text()).not.toContain('Private gateway detail');
    },
  );
  it('bounds a hung upstream call and gives safe retry guidance', async () => {
    vi.useFakeTimers();
    const upstream: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) reject(new Error('Cancelled'));
        else
          signal?.addEventListener(
            'abort',
            () => reject(new Error('Cancelled')),
            { once: true },
          );
      });
    const response = createIdentityHandler(() => config, upstream)(request());
    await vi.advanceTimersByTimeAsync(8100);
    expect((await response).status).toBe(504);
  });
  it('never accepts a privileged key as server user-context configuration', () => {
    vi.stubEnv('SUPABASE_URL', config.supabaseUrl);
    vi.stubEnv(
      'SUPABASE_PUBLISHABLE_KEY',
      'sb_secret_do_not_use_for_member_requests',
    );
    expect(() => loadServerConfig()).toThrow('temporarily unavailable');
  });
});

describe('browser-safe identity contracts', () => {
  it('does not allow setting computed onboarding timestamps', () => {
    expect(
      onboardingPatchSchema.safeParse({
        expected_revision: 0,
        action: 'complete',
        completed_at: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(false);
    expect(
      onboardingPatchSchema.safeParse({
        expected_revision: 0,
        action: 'acknowledge_disclosure',
      }).success,
    ).toBe(false);
  });
  it('rejects empty changes, invalid currency, control characters and oversized names', () => {
    for (const patch of [
      { expected_revision: 0 },
      { expected_revision: 0, display_currency: 'BTC' },
      { expected_revision: 0, display_name: 'a\nb' },
      { expected_revision: 0, display_name: 'a'.repeat(81) },
    ]) {
      expect(profilePatchSchema.safeParse(patch).success).toBe(false);
    }
  });
});
