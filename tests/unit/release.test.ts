import { describe, expect, it, vi } from 'vitest';
import { validateReleaseConfig } from '../../scripts/release-config.ts';
import { releaseSmoke } from '../../scripts/release-smoke.ts';

const release = 'b'.repeat(40);
const env = {
  SENTRY_DSN: 'https://123abc@o1.ingest.us.sentry.io/123',
  VITE_SENTRY_DSN: 'https://123abc@o1.ingest.us.sentry.io/124',
  PII_RELEASE: release,
  VITE_PII_RELEASE: release,
  PII_ENVIRONMENT: 'staging',
  VITE_PII_ENVIRONMENT: 'staging',
  SUPABASE_URL: 'https://synthetic.supabase.co',
  VITE_SUPABASE_URL: 'https://synthetic.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic',
  PII_READINESS_KEY: 'synthetic-readiness-key-12345678901',
};
describe('release configuration', () => {
  it('accepts coherent hosted metadata without claiming hosted readiness', () =>
    expect(validateReleaseConfig(env)).toEqual({
      release,
      environment: 'staging',
    }));
  it.each([
    { SENTRY_DSN: '' },
    { VITE_PII_RELEASE: 'c'.repeat(40) },
    { VITE_PII_ENVIRONMENT: 'production' },
    { VERCEL_GIT_COMMIT_SHA: 'd'.repeat(40) },
    { VITE_SUPABASE_URL: 'https://other.supabase.co' },
    { PII_READINESS_KEY: 'short' },
    { PII_ENVIRONMENT: 'local', VITE_PII_ENVIRONMENT: 'local' },
  ])('rejects missing or inconsistent release fields: %o', (override) =>
    expect(() => validateReleaseConfig({ ...env, ...override })).toThrow(),
  );
});

describe('release smoke', () => {
  const smokeEnv = {
    ...env,
    PII_SMOKE_URL: 'https://staging.example.test',
    PII_SMOKE_ACCESS_TOKEN: 'synthetic-access-token',
  };
  const upstream: typeof fetch = async (input, init) => {
    const path = new URL(String(input)).pathname;
    const headers = {
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    };
    if (path === '/api/health')
      return Response.json({ status: 'alive' }, { headers });
    if (path === '/api/ready')
      return new Headers(init?.headers).has('authorization')
        ? Response.json({ status: 'ready', release }, { headers })
        : new Response(null, { status: 404 });
    if (path === '/api/v1/me')
      return Response.json(
        { error: { code: 'unauthenticated' } },
        { status: 401, headers },
      );
    return new Response(
      `<html><head><meta name="pii-release" content="${release}"></head><body><div id="root"></div></body></html>`,
      { headers: { ...headers, 'Content-Type': 'text/html' } },
    );
  };
  it('verifies liveness, privacy, actual readiness, build identity and deep links', async () => {
    const fetcher = vi.fn(upstream);
    expect(await releaseSmoke(smokeEnv, fetcher)).toEqual({
      release,
      result: 'passed',
    });
    expect(fetcher).toHaveBeenCalledTimes(7);
    for (const [input, init] of fetcher.mock.calls) {
      expect(init?.redirect).toBe('error');
      expect(String(input)).not.toContain(smokeEnv.PII_SMOKE_ACCESS_TOKEN);
      const headers = new Headers(init?.headers);
      if (headers.has('authorization'))
        expect(new URL(String(input)).pathname).toBe('/api/ready');
    }
  });
  it('rejects a stale deployment despite HTTP 200', async () => {
    await expect(
      releaseSmoke(smokeEnv, async (input, init) =>
        new URL(String(input)).pathname === '/api/ready' &&
        new Headers(init?.headers).has('authorization')
          ? Response.json({ status: 'ready', release: 'c'.repeat(40) })
          : upstream(input, init),
      ),
    ).rejects.toThrow('release identity');
  });
  it.each([
    'http://example.test',
    'https://user:password@example.test',
    'https://example.test/?token=secret',
    'https://example.test/path',
  ])('refuses unsafe target %s before sending credentials', async (url) => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      releaseSmoke({ ...smokeEnv, PII_SMOKE_URL: url }, fetcher),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
