import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { serverConfigSchema } from '../../packages/server/src/config.ts';

// No env-supplied URLs: this destructive-fixture harness only targets this repo's
// isolated local stack. Status credentials stay in memory and are never logged.
if (
  !readFileSync('supabase/config.toml', 'utf8').includes(
    'project_id = "pii-foundation"',
  )
)
  throw new Error('Unexpected local project.');
const status: unknown = JSON.parse(
  execFileSync('node_modules/.bin/supabase', ['status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
if (!status || typeof status !== 'object')
  throw new Error('Start the local PII stack first.');
const settings = status as Record<string, unknown>;
if (
  settings.API_URL !== 'http://127.0.0.1:55421' ||
  settings.DB_URL !== 'postgresql://postgres:postgres@127.0.0.1:55422/postgres'
)
  throw new Error(
    'Integration tests refuse non-local or unexpected database targets.',
  );
export const config = serverConfigSchema.parse({
  supabaseUrl: settings.API_URL,
  publishableKey: settings.PUBLISHABLE_KEY,
});
if (
  typeof settings.SECRET_KEY !== 'string' ||
  typeof settings.JWT_SECRET !== 'string'
)
  throw new Error('Local test credentials unavailable.');
export const jwtSecret = settings.JWT_SECRET;
export const admin = createClient(config.supabaseUrl, settings.SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const pool = new pg.Pool({
  connectionString: settings.DB_URL,
  max: 3,
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000,
});

export async function asUser<T>(
  token: string,
  operation: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const claimsPart = token.split('.')[1];
  if (!claimsPart) throw new Error('Test session has no claims.');
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('set local role authenticated');
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      Buffer.from(claimsPart, 'base64url').toString('utf8'),
    ]);
    return await operation(client);
  } finally {
    await client.query('rollback');
    client.release();
  }
}
