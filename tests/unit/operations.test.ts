import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createIdentityHandler,
  createReadinessHandler,
  liveness,
} from '@pii/server';
import {
  redactDiagnostic,
  diagnosticRoute,
  telemetryConfigSchema,
} from '@pii/contracts';
import { createServerTelemetry } from '../../packages/server/src/telemetry.ts';
import { createBrowserTelemetry } from '../../apps/web/src/app/telemetry.ts';

const config = {
  supabaseUrl: 'http://127.0.0.1:55421',
  publishableKey: 'sb_publishable_test',
};
const release = 'a'.repeat(40);
const telemetryConfig = {
  dsn: 'https://123abc@o1.ingest.us.sentry.io/123',
  release,
  environment: 'local' as const,
};
const requestId = '00000000-0000-4000-8000-000000000001';
const diagnostic = {
  kind: 'api_failure' as const,
  route: 'me' as const,
  code: 'internal_error' as const,
  request_id: requestId,
};
const key = 'synthetic-readiness-key-only-123456';
const token = 'test.test.signature';
const probe = (override: Record<string, string> = {}) =>
  new Request('http://localhost/api/ready', {
    headers: {
      'x-pii-readiness-key': key,
      authorization: `Bearer ${token}`,
      ...override,
    },
  });
afterEach(() => vi.useRealTimers());

describe('privacy boundary and SDK delivery', () => {
  it.each(['browser', 'server'])(
    'redacts the actual %s SDK envelope while retaining correlation',
    async (runtime) => {
      const envelopes: unknown[] = [];
      const transport = () => ({
        send: async (envelope: unknown) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      });
      const client =
        runtime === 'browser'
          ? createBrowserTelemetry(telemetryConfig, transport)
          : createServerTelemetry(telemetryConfig, transport).client;
      const secret = 'SENSITIVE-password-holdings-prompt-bearer-cookie-email';
      client.captureEvent({
        message: secret,
        tags: { ...diagnostic, extra_tag: secret },
        user: { email: secret, ip_address: secret },
        request: {
          url: `https://example.test/${secret}?code=${secret}`,
          headers: { Authorization: secret },
          data: secret,
          cookies: { session: secret },
        },
        exception: {
          values: [
            {
              type: secret,
              value: secret,
              stacktrace: {
                frames: [{ filename: secret, vars: { password: secret } }],
              },
            },
          ],
        },
        extra: { nested: { holdings: secret } },
        contexts: { secret: { prompt: secret } },
        breadcrumbs: [{ message: secret, data: { token: secret } }],
      });
      await client.flush(1000);
      expect(envelopes).toHaveLength(1);
      const serialized = JSON.stringify(envelopes);
      expect(serialized).not.toContain(secret);
      expect(serialized).toContain(requestId);
      expect(serialized).toContain(release);
      expect(serialized).toContain('PII api_failure: internal_error');
      await client.close();
    },
  );
  it('drops unknown events, invalid tags, unsafe DSNs and arbitrary URL paths', () => {
    expect(redactDiagnostic({}, telemetryConfig)).toBeNull();
    expect(
      redactDiagnostic(
        { tags: { ...diagnostic, code: 'private account 123' } },
        telemetryConfig,
      ),
    ).toBeNull();
    expect(diagnosticRoute('/app/private-account?token=secret')).toBe('other');
    expect(
      telemetryConfigSchema.safeParse({
        ...telemetryConfig,
        dsn: 'https://secret@untrusted.test/123',
      }).success,
    ).toBe(false);
    expect(
      telemetryConfigSchema.safeParse({
        ...telemetryConfig,
        release: 'user@example.test',
      }).success,
    ).toBe(false);
  });
  it('retains only bounded build-asset stack locations for private source maps', () => {
    const safe = redactDiagnostic(
      {
        tags: diagnostic,
        exception: {
          values: [
            {
              value: 'secret',
              stacktrace: {
                frames: [
                  {
                    filename:
                      'https://private-host.test/assets/index-AbCd123.js',
                    lineno: 2,
                    colno: 42,
                    function: 'secret',
                    vars: { holding: 'secret' },
                  },
                  {
                    filename:
                      'https://private-host.test/assets/index-AbCd123.js?token=secret',
                    lineno: 3,
                    colno: 10,
                  },
                  {
                    filename: '/Users/private-person/file.ts',
                    lineno: 4,
                    colno: 10,
                  },
                ],
              },
            },
          ],
        },
      },
      telemetryConfig,
    );
    expect(safe?.exception?.values[0]?.stacktrace.frames).toEqual([
      { filename: 'app:///assets/index-AbCd123.js', lineno: 2, colno: 42 },
    ]);
    expect(JSON.stringify(safe)).not.toContain('secret');
    expect(JSON.stringify(safe)).not.toContain('private-host');
  });
  it('correlates API failures without passing the original error; ignores ordinary 4xx', async () => {
    const report = vi.fn(async () => {});
    const handle = createIdentityHandler(
      () => {
        throw new Error('private-token');
      },
      fetch,
      report,
    );
    const response = await handle(
      new Request('http://localhost/api/v1/me', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(response.status).toBe(500);
    expect(report).toHaveBeenCalledWith({
      ...diagnostic,
      request_id: response.headers.get('x-request-id'),
    });
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
    await handle(new Request('http://localhost/api/v1/me'));
    expect(report).toHaveBeenCalledTimes(1);
  });
  it('keeps the safe API response even if monitoring fails', async () => {
    const handle = createIdentityHandler(
      () => {
        throw new Error('private');
      },
      fetch,
      async () => {
        throw new Error('monitor unavailable');
      },
    );
    expect(
      (
        await handle(
          new Request('http://localhost/api/v1/me', {
            headers: { authorization: `Bearer ${token}` },
          }),
        )
      ).status,
    ).toBe(500);
  });
});

describe('liveness is not readiness', () => {
  it('reports only process liveness with no dependency or environment detail', async () => {
    const response = await liveness(new Request('http://localhost/api/health'));
    expect(await response.json()).toEqual({ status: 'alive' });
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(
      (
        await liveness(
          new Request('http://localhost/api/health', { method: 'POST' }),
        )
      ).status,
    ).toBe(405);
  });
  it('makes no backend calls for absent, malformed, wrong or unconfigured probe keys', async () => {
    const upstream = vi.fn<typeof fetch>();
    const handle = createReadinessHandler(
      () => config,
      upstream,
      () => key,
    );
    for (const supplied of ['', 'x'.repeat(key.length), 'é'.repeat(key.length)])
      expect(
        (await handle(probe({ 'x-pii-readiness-key': supplied }))).status,
      ).toBe(404);
    expect(
      (
        await createReadinessHandler(
          () => config,
          upstream,
          () => undefined,
        )(probe())
      ).status,
    ).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
  it.each([401, 500, 503])(
    'fails closed on Auth failure %i and reveals no upstream payload',
    async (status) => {
      const upstream: typeof fetch = async () =>
        Response.json({ message: 'secret upstream' }, { status });
      const report = vi.fn(async () => {});
      const response = await createReadinessHandler(
        () => config,
        upstream,
        () => key,
        () => release,
        report,
      )(probe());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        status: 'not_ready',
        request_id: response.headers.get('x-request-id'),
      });
      expect(report).toHaveBeenCalledTimes(1);
    },
  );
  it('bounds a stalled upstream request', async () => {
    vi.useFakeTimers();
    const upstream: typeof fetch = async (_input, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener(
          'abort',
          () => reject(new Error('aborted')),
          { once: true },
        ),
      );
    const report = vi.fn(async () => {});
    const pending = createReadinessHandler(
      () => config,
      upstream,
      () => key,
      () => release,
      report,
    )(probe());
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(503);
    expect(report.mock.calls[0]).toEqual([
      {
        kind: 'readiness_failure',
        route: 'readiness',
        code: 'request_timeout',
        request_id: expect.any(String),
      },
    ]);
  });
});
