import { spawn } from 'node:child_process';

const child = spawn(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'playwright.auth.config.ts',
    ...process.argv.slice(2),
  ],
  {
    env: { ...process.env, PLAYWRIGHT_NO_COPY_PROMPT: '1' },
    stdio: 'inherit',
  },
);
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
process.once('SIGTERM', () => child.kill('SIGTERM'));
process.once('SIGINT', () => child.kill('SIGINT'));
