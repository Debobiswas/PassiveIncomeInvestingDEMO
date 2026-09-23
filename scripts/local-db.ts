import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';

const exec = promisify(execFile);
const cli = 'node_modules/.bin/supabase';
const config = readFileSync('supabase/config.toml', 'utf8');
const operation = process.argv[2];
if (
  !/^project_id = "pii-foundation"$/m.test(config) ||
  !['start', 'reset'].includes(operation ?? '') ||
  process.argv.length !== 3
) {
  throw new Error(
    'Use db:start or db:reset:local with the isolated pii-foundation configuration.',
  );
}
async function assertLocal() {
  const { stdout } = await exec(cli, ['status', '-o', 'json']);
  const value: unknown = JSON.parse(stdout);
  if (
    !value ||
    typeof value !== 'object' ||
    !('API_URL' in value) ||
    !('DB_URL' in value) ||
    value.API_URL !== 'http://127.0.0.1:55421' ||
    value.DB_URL !== 'postgresql://postgres:postgres@127.0.0.1:55422/postgres'
  ) {
    throw new Error('Refusing an unexpected database target.');
  }
}
try {
  if (operation === 'reset') {
    await assertLocal();
    console.log(
      'Resetting ONLY the disposable pii-foundation database on port 55422. Local data will be removed.',
    );
    await exec(cli, ['db', 'reset', '--local', '--yes'], {
      timeout: 600000,
      maxBuffer: 8 * 1024 * 1024,
    });
  } else {
    await exec(
      cli,
      [
        'start',
        '--exclude',
        'realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor',
      ],
      { timeout: 600000, maxBuffer: 8 * 1024 * 1024 },
    );
  }
  await assertLocal();
  console.log(
    'Local PII database ready. Auth/Data API: http://127.0.0.1:55421. Credentials were not printed.',
  );
} catch {
  console.error(
    'Local database operation failed. Check Docker and the pii-foundation containers; no remote fallback was attempted.',
  );
  process.exitCode = 1;
}
