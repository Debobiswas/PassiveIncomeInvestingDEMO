import { z } from 'zod';

// Positive allowlist, not a blacklist of known secrets. Never accept free-text.
export const diagnosticSchema = z.object({
  kind: z.enum([
    'api_failure',
    'browser_failure',
    'route_failure',
    'member_failure',
    'readiness_failure',
    'smoke',
  ]),
  route: z.enum([
    'me',
    'onboarding',
    'admin',
    'readiness',
    'login',
    'callback',
    'recovery',
    'member',
    'public',
    'other',
  ]),
  code: z.enum([
    'internal_error',
    'service_unavailable',
    'request_timeout',
    'unexpected_error',
    'invalid_response',
    'synthetic',
  ]),
  request_id: z.uuid().optional(),
});
export type Diagnostic = z.infer<typeof diagnosticSchema>;
export const releaseSchema = z.string().regex(/^[a-f0-9]{40}$/);
export const telemetryConfigSchema = z.object({
  dsn: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      /^o\d+\.ingest(?:\.us)?\.sentry\.io$/.test(url.hostname) &&
      /^[a-f0-9]+$/.test(url.username) &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash &&
      /^\/\d+$/.test(url.pathname)
    );
  }),
  release: releaseSchema,
  environment: z.enum(['local', 'staging', 'production']),
});
export type TelemetryConfig = z.infer<typeof telemetryConfigSchema>;
export const privateDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  frameContextLines: 0,
};

export function diagnosticRoute(path: string): Diagnostic['route'] {
  switch (path) {
    case '/api/v1/me':
      return 'me';
    case '/api/v1/me/onboarding':
      return 'onboarding';
    case '/api/v1/admin/access':
      return 'admin';
    case '/api/ready':
      return 'readiness';
    case '/login':
      return 'login';
    case '/auth/callback':
      return 'callback';
    case '/auth/recovery':
      return 'recovery';
    case '/app':
      return 'member';
    case '/app/onboarding':
      return 'onboarding';
    case '/':
      return 'public';
    default:
      return 'other';
  }
}

// Called LAST by both SDKs. Rebuilds safe messages/asset locations; discards
// request/URL, user, breadcrumbs, contexts, extras, spans and arbitrary tags.
export function redactDiagnostic(
  event: { tags?: unknown; event_id?: string; exception?: unknown },
  config: TelemetryConfig,
) {
  const parsed = diagnosticSchema.safeParse(event.tags);
  if (!parsed.success) return null;
  // Only versioned browser asset locations survive. No host, path/query inputs,
  // function names, source context, locals or exception text are retained.
  const exception = z
    .object({
      values: z.array(
        z.object({
          stacktrace: z
            .object({
              frames: z.array(
                z.object({
                  filename: z.string(),
                  lineno: z.number().int().positive(),
                  colno: z.number().int().nonnegative(),
                }),
              ),
            })
            .optional(),
        }),
      ),
    })
    .safeParse(event.exception);
  const frames = exception.success
    ? exception.data.values
        .flatMap((value) => value.stacktrace?.frames ?? [])
        .flatMap((frame) => {
          const match = /(?:^|\/)assets\/([A-Za-z0-9_-]{1,120}\.js)$/.exec(
            frame.filename,
          );
          return match
            ? [
                {
                  filename: `app:///assets/${match[1]}`,
                  lineno: frame.lineno,
                  colno: frame.colno,
                },
              ]
            : [];
        })
        .slice(-30)
    : [];
  return {
    type: undefined,
    ...(event.event_id && /^[a-f0-9]{32}$/.test(event.event_id)
      ? { event_id: event.event_id }
      : {}),
    level: 'error' as const,
    message: `PII ${parsed.data.kind}: ${parsed.data.code}`,
    ...(frames.length
      ? {
          exception: {
            values: [
              {
                type: 'Error',
                value: `PII ${parsed.data.kind}`,
                stacktrace: { frames },
              },
            ],
          },
        }
      : {}),
    release: config.release,
    environment: config.environment,
    tags: parsed.data,
    fingerprint: [parsed.data.kind, parsed.data.route, parsed.data.code],
  };
}
