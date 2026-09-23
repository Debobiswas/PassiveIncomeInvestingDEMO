import { execFileSync, spawn } from 'node:child_process';
import { createIdentityHandler } from '@pii/server';
import { apiServer } from './dev-api.ts';

const settings = JSON.parse(
  execFileSync('node_modules/.bin/supabase', ['status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
) as Record<string, unknown>;
if (
  settings.API_URL !== 'http://127.0.0.1:55421' ||
  settings.DB_URL !==
    'postgresql://postgres:postgres@127.0.0.1:55422/postgres' ||
  typeof settings.PUBLISHABLE_KEY !== 'string' ||
  !settings.PUBLISHABLE_KEY.startsWith('sb_publishable_')
)
  throw new Error('Auth browser tests require the isolated local PII stack.');
const config = {
  supabaseUrl: settings.API_URL,
  publishableKey: settings.PUBLISHABLE_KEY,
};
const api = apiServer(createIdentityHandler(() => config));
api.listen(3002, '127.0.0.1');
const vite = spawn(
  'node_modules/.bin/vite',
  ['apps/web', '--host', '127.0.0.1', '--port', '5180', '--strictPort'],
  {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: config.supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
      PII_API_PORT: '3002',
      VITE_GOOGLE_AUTH_ENABLED: 'true', // Redirect denial is intercepted; no live Google acceptance claim.
    },
    stdio: 'inherit',
  },
);
const stop = () => {
  vite.kill('SIGTERM');
  api.close();
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
vite.once('exit', (code) => {
  api.close();
  process.exitCode = code ?? 1;
});
