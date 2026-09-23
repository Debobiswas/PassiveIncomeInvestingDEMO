import { NodeClient, makeNodeTransport } from '@sentry/node';
import {
  redactDiagnostic,
  telemetryConfigSchema,
  privateDataCollection,
} from '@pii/contracts';
import type { Diagnostic, TelemetryConfig } from '@pii/contracts';

export function createServerTelemetry(
  config: TelemetryConfig,
  transport: ConstructorParameters<
    typeof NodeClient
  >[0]['transport'] = makeNodeTransport,
) {
  const client = new NodeClient({
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
  return {
    async report(diagnostic: Diagnostic) {
      client.captureEvent({ tags: diagnostic });
      // Await bounded delivery before a serverless request can freeze.
      await client.flush(500);
    },
    client,
  };
}

let telemetry: ReturnType<typeof createServerTelemetry> | undefined;
export async function reportServer(diagnostic: Diagnostic): Promise<void> {
  try {
    if (!telemetry) {
      const config = telemetryConfigSchema.safeParse({
        dsn: process.env.SENTRY_DSN,
        release: process.env.PII_RELEASE,
        environment: process.env.PII_ENVIRONMENT,
      });
      if (!config.success) return; // Local development is intentionally opt-in.
      telemetry = createServerTelemetry(config.data);
    }
    await telemetry.report(diagnostic);
  } catch {
    /* Monitoring failure must never replace the application response. */
  }
}
