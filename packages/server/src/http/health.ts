import { randomUUID, timingSafeEqual } from 'node:crypto';
import { releaseSchema } from '@pii/contracts';
import type { Diagnostic } from '@pii/contracts';
import { loadServerConfig } from '../config.ts';
import type { ServerConfig } from '../config.ts';
import { identityRepository } from '../identity/repository.ts';
import { reportServer } from '../telemetry.ts';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};
export async function liveness(request: Request): Promise<Response> {
  if (request.method !== 'GET')
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: 'GET' },
    });
  // Process only: no environment, provider, version, schema or credential detail.
  return Response.json({ status: 'alive' }, { headers });
}

export function createReadinessHandler(
  getConfig: () => ServerConfig = loadServerConfig,
  fetcher: typeof fetch = fetch,
  getKey: () => string | undefined = () => process.env.PII_READINESS_KEY,
  getRelease: () => string | undefined = () => process.env.PII_RELEASE,
  report: (diagnostic: Diagnostic) => Promise<void> = reportServer,
) {
  return async (request: Request): Promise<Response> => {
    const key = getKey();
    const supplied = request.headers.get('x-pii-readiness-key') ?? '';
    // Gate BEFORE any dependency work. No public endpoint for spending DB calls.
    if (
      !key ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(key) ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(supplied) ||
      supplied.length !== key.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(key))
    )
      return new Response(null, { status: 404, headers });
    if (request.method !== 'GET')
      return new Response(null, {
        status: 405,
        headers: { ...headers, Allow: 'GET' },
      });
    const requestId = randomUUID();
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 5000);
    const signal = AbortSignal.any([request.signal, controller.signal]);
    const responseHeaders = { ...headers, 'X-Request-Id': requestId };
    try {
      if (new URL(request.url).search) throw new Error('Invalid probe');
      const release = releaseSchema.parse(getRelease());
      const auth = request.headers.get('authorization') ?? '';
      const token =
        auth.length <= 8192
          ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(
              auth,
            )?.[1]
          : undefined;
      if (!token) throw new Error('Invalid probe');
      const repo = await identityRepository(
        getConfig(),
        token,
        signal,
        fetcher,
      );
      await repo.me();
      await repo.onboarding();
      if (signal.aborted) throw new Error('Probe deadline');
      return Response.json(
        { status: 'ready', release, request_id: requestId },
        { headers: responseHeaders },
      );
    } catch {
      try {
        await report({
          kind: 'readiness_failure',
          route: 'readiness',
          code: signal.aborted ? 'request_timeout' : 'service_unavailable',
          request_id: requestId,
        });
      } catch {
        /* best effort */
      }
      return Response.json(
        { status: 'not_ready', request_id: requestId },
        { status: 503, headers: responseHeaders },
      );
    } finally {
      clearTimeout(deadline);
    }
  };
}
