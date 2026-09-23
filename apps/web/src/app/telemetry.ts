/// <reference types="vite/client" />
import {
  BrowserClient,
  makeFetchTransport,
  defaultStackParser,
} from '@sentry/browser';
import type { BrowserOptions } from '@sentry/browser';
import {
  diagnosticRoute,
  redactDiagnostic,
  telemetryConfigSchema,
  privateDataCollection,
} from '@pii/contracts';
import type { Diagnostic, TelemetryConfig } from '@pii/contracts';

export function createBrowserTelemetry(
  config: TelemetryConfig,
  transport: BrowserOptions['transport'] = makeFetchTransport,
) {
  const client = new BrowserClient({
    ...config,
    transport,
    integrations: [],
    stackParser: () => [],
    dataCollection: privateDataCollection,
    sendClientReports: false,
    tracesSampleRate: 0,
    tracePropagationTargets: [],
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    beforeSend: (event) => redactDiagnostic(event, config),
  });
  client.init();
  return client;
}
let client: ReturnType<typeof createBrowserTelemetry> | undefined;
let reported = 0;
export function reportBrowser(diagnostic: Diagnostic, error?: unknown) {
  // Bounded per page load; no retry queue, local persistence or raw errors.
  if (!client || reported >= 20) return;
  reported++;
  try {
    client.captureEvent({
      tags: diagnostic,
      ...(error instanceof Error && typeof error.stack === 'string'
        ? {
            exception: {
              values: [
                { stacktrace: { frames: defaultStackParser(error.stack) } },
              ],
            },
          }
        : {}),
    });
  } catch {
    /* best effort */
  }
}
export function startBrowserTelemetry() {
  const config = telemetryConfigSchema.safeParse({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    release: import.meta.env.VITE_PII_RELEASE,
    environment: import.meta.env.VITE_PII_ENVIRONMENT,
  });
  if (!config.success || client) return;
  try {
    client = createBrowserTelemetry(config.data);
    const report = (event: Event) =>
      reportBrowser(
        {
          kind: 'browser_failure',
          route: diagnosticRoute(window.location.pathname),
          code: 'unexpected_error',
        },
        event instanceof ErrorEvent
          ? event.error
          : event instanceof PromiseRejectionEvent
            ? event.reason
            : undefined,
      );
    window.addEventListener('error', report);
    window.addEventListener('unhandledrejection', report);
  } catch {
    /* Local UI remains usable if monitoring cannot initialize. */
  }
}
