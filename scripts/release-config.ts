import { pathToFileURL } from 'node:url';
import { telemetryConfigSchema } from '@pii/contracts';
import { serverConfigSchema } from '../packages/server/src/config.ts';

export function validateReleaseConfig(env: Record<string, string | undefined>) {
  const server = telemetryConfigSchema.safeParse({
    dsn: env.SENTRY_DSN,
    release: env.PII_RELEASE,
    environment: env.PII_ENVIRONMENT,
  });
  const browser = telemetryConfigSchema.safeParse({
    dsn: env.VITE_SENTRY_DSN,
    release: env.VITE_PII_RELEASE,
    environment: env.VITE_PII_ENVIRONMENT,
  });
  if (!server.success || !browser.success)
    throw new Error(
      'Release requires valid server/browser Sentry DSNs, full commit SHA and environment.',
    );
  if (
    server.data.environment === 'local' ||
    server.data.environment !== browser.data.environment ||
    server.data.release !== browser.data.release
  )
    throw new Error(
      'Release environments and commit SHAs must match and cannot be local.',
    );
  if (
    env.VERCEL_GIT_COMMIT_SHA &&
    env.VERCEL_GIT_COMMIT_SHA !== server.data.release
  )
    throw new Error('Release SHA does not match the Vercel checkout.');
  const backend = serverConfigSchema.safeParse({
    supabaseUrl: env.SUPABASE_URL,
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
  });
  if (
    !backend.success ||
    !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(backend.data.supabaseUrl)
  )
    throw new Error(
      'Release requires a hosted Supabase project URL and publishable key.',
    );
  if (
    env.VITE_SUPABASE_URL !== backend.data.supabaseUrl ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY !== backend.data.publishableKey
  )
    throw new Error('Browser and API Supabase targets must match.');
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(env.PII_READINESS_KEY ?? ''))
    throw new Error(
      'Release requires a separate random readiness key (32–128 URL-safe characters).',
    );
  // Presence is not hosted verification. Isolation/regions/alerts remain evidence gates.
  return { release: server.data.release, environment: server.data.environment };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  (process.env.VERCEL === '1' || process.env.PII_REQUIRE_RELEASE_CONFIG === '1')
) {
  try {
    validateReleaseConfig(process.env);
    console.log(
      'Release configuration consistency: passed (not hosted acceptance).',
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Release configuration invalid.',
    );
    process.exitCode = 1;
  }
}
