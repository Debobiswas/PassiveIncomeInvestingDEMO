import { pathToFileURL } from 'node:url';
import { releaseSchema } from '@pii/contracts';

// Read-only. Explicit target; secrets come from the environment, never argv or URLs.
export async function releaseSmoke(
  env: Record<string, string | undefined>,
  fetcher: typeof fetch = fetch,
) {
  const target = new URL(env.PII_SMOKE_URL ?? '');
  if (
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    target.pathname !== '/'
  )
    throw new Error('Smoke target must be an exact HTTPS origin.');
  const release = releaseSchema.parse(env.PII_RELEASE);
  if (!env.PII_READINESS_KEY || !env.PII_SMOKE_ACCESS_TOKEN)
    throw new Error(
      'Smoke requires a readiness key and a fresh synthetic-user access token.',
    );
  const get = async (path: string, privateProbe = false) => {
    const headers: Record<string, string> = {
      ...(env.VERCEL_AUTOMATION_BYPASS_SECRET
        ? { 'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET }
        : {}),
      ...(privateProbe
        ? {
            'x-pii-readiness-key': env.PII_READINESS_KEY!,
            Authorization: `Bearer ${env.PII_SMOKE_ACCESS_TOKEN}`,
          }
        : {}),
    };
    // Never follow redirects carrying credentials to a different deployment.
    return fetcher(new URL(path, target), {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
  };
  const alive = await get('/api/health');
  if (
    alive.status !== 200 ||
    (await alive.json()).status !== 'alive' ||
    !alive.headers.get('cache-control')?.includes('no-store')
  )
    throw new Error('Liveness smoke failed.');
  const denied = await get('/api/ready');
  if (denied.status !== 404) throw new Error('Readiness must not be public.');
  const anonymous = await get('/api/v1/me');
  if (
    anonymous.status !== 401 ||
    !anonymous.headers.get('cache-control')?.includes('no-store') ||
    (await anonymous.json()).error?.code !== 'unauthenticated'
  )
    throw new Error('Anonymous API isolation smoke failed.');
  const ready = await get('/api/ready', true);
  const data: unknown = await ready.json();
  if (
    ready.status !== 200 ||
    !data ||
    typeof data !== 'object' ||
    !('release' in data) ||
    data.release !== release ||
    !('status' in data) ||
    data.status !== 'ready' ||
    !ready.headers.get('cache-control')?.includes('no-store')
  )
    throw new Error('Backend readiness or release identity failed.');
  for (const path of ['/', '/login', '/app/onboarding']) {
    const page = await get(path);
    const html = await page.text();
    if (
      page.status !== 200 ||
      !page.headers.get('content-type')?.includes('text/html') ||
      !html.includes(`name="pii-release" content="${release}"`) ||
      !html.includes('id="root"')
    )
      throw new Error('Browser deep link or release identity failed.');
    if (
      page.headers.get('referrer-policy') !== 'no-referrer' ||
      page.headers.get('x-content-type-options') !== 'nosniff' ||
      page.headers.get('x-frame-options') !== 'DENY'
    )
      throw new Error('Browser security headers failed.');
  }
  return { release, result: 'passed' as const };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.log(JSON.stringify(await releaseSmoke(process.env)));
  } catch {
    console.error(
      'Release smoke failed. Check target/configuration and sanitized provider diagnostics; no credentials or response bodies are printed.',
    );
    process.exitCode = 1;
  }
}
