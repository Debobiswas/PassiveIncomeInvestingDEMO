import { randomUUID } from 'node:crypto';
import {
  emptyInputSchema,
  profilePatchSchema,
  onboardingPatchSchema,
  diagnosticRoute,
  diagnosticSchema,
} from '@pii/contracts';
import type { Diagnostic } from '@pii/contracts';
import { reportServer } from '../telemetry.ts';
import { loadServerConfig } from '../config.ts';
import type { ServerConfig } from '../config.ts';
import { ApiError, invalidInput, unauthenticated, timeout } from '../errors.ts';
import { identityRepository } from '../identity/repository.ts';
import { jsonBody } from './body.ts';

const methods: Record<string, readonly string[]> = {
  '/api/v1/me': ['GET', 'POST', 'PATCH'],
  '/api/v1/me/onboarding': ['GET', 'PATCH'],
  '/api/v1/admin/access': ['GET'],
};

export function createIdentityHandler(
  getConfig: () => ServerConfig = loadServerConfig,
  fetcher: typeof fetch = fetch,
  report: (diagnostic: Diagnostic) => Promise<void> = reportServer,
) {
  return async (request: Request): Promise<Response> => {
    const requestId = randomUUID();
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 8000);
    const signal = AbortSignal.any([request.signal, controller.signal]);
    const headers = {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': requestId,
    };
    try {
      const url = new URL(request.url);
      const allowed = methods[url.pathname];
      if (!allowed)
        throw new ApiError(404, 'not_found', 'This endpoint does not exist.');
      if (!allowed.includes(request.method)) {
        return Response.json(
          {
            error: {
              code: 'method_not_allowed',
              message: 'This method is not supported.',
              request_id: requestId,
              retryable: false,
            },
          },
          { status: 405, headers: { ...headers, Allow: allowed.join(', ') } },
        );
      }
      if (url.search) throw invalidInput(); // No owner/filter query parameters in this contract.
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin)
        throw new ApiError(
          403,
          'forbidden',
          'Cross-origin browser requests are not supported.',
        );
      const auth = request.headers.get('authorization');
      const token =
        auth && auth.length <= 8192
          ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
              auth,
            )?.[1]
          : undefined;
      if (!token) throw unauthenticated();
      const body =
        request.method === 'GET' ? undefined : await jsonBody(request, signal);
      const profilePatch =
        url.pathname === '/api/v1/me' && request.method === 'PATCH'
          ? profilePatchSchema.safeParse(body)
          : undefined;
      const onboardingPatch =
        url.pathname === '/api/v1/me/onboarding' && request.method === 'PATCH'
          ? onboardingPatchSchema.safeParse(body)
          : undefined;
      if (
        profilePatch?.success === false ||
        onboardingPatch?.success === false ||
        (request.method === 'POST' && !emptyInputSchema.safeParse(body).success)
      )
        throw invalidInput();
      const repository = await identityRepository(
        getConfig(),
        token,
        signal,
        fetcher,
      );
      let result: unknown;
      if (url.pathname === '/api/v1/admin/access')
        result = await repository.staffAccess();
      else if (profilePatch?.success)
        result = await repository.updateProfile(profilePatch.data);
      else if (onboardingPatch?.success)
        result = await repository.updateOnboarding(onboardingPatch.data);
      else if (url.pathname === '/api/v1/me/onboarding')
        result = await repository.onboarding();
      else if (request.method === 'POST')
        result = await repository.initialize();
      else result = await repository.me();
      return Response.json(result, { headers });
    } catch (error) {
      const safe = signal.aborted
        ? timeout()
        : error instanceof ApiError
          ? error
          : new ApiError(
              500,
              'internal_error',
              'The request could not be completed.',
            );
      if (safe.status >= 500) {
        const diagnostic = diagnosticSchema.parse({
          kind: 'api_failure',
          route: diagnosticRoute(new URL(request.url).pathname),
          code:
            safe.status === 504
              ? 'request_timeout'
              : safe.status === 503
                ? 'service_unavailable'
                : 'internal_error',
          request_id: requestId,
        });
        try {
          await report(diagnostic);
        } catch {
          /* Telemetry never changes HTTP semantics. */
        }
      }
      return Response.json(
        {
          error: {
            code: safe.code,
            message: safe.message,
            request_id: requestId,
            retryable: safe.retryable,
          },
        },
        { status: safe.status, headers },
      );
    } finally {
      clearTimeout(deadline);
    }
  };
}
