import { describe, expect, it } from 'vitest';
// Build tooling is plain ESM so the same gate runs under Node in CI.
// @ts-expect-error The small Node script has no generated declaration file.
import { initialFiles } from '../../scripts/check-build.mjs';

describe('initial bundle accounting', () => {
  it('counts shared eager dependencies once but excludes lazy financial screens', () => {
    expect(
      initialFiles({
        'index.html': {
          isEntry: true,
          file: 'entry.js',
          imports: ['router', 'shared'],
          css: ['app.css'],
          dynamicImports: ['charts'],
        },
        router: { file: 'router.js', imports: ['shared'] },
        shared: { file: 'shared.js' },
        charts: { file: 'charts.js', css: ['charts.css'] },
      }),
    ).toEqual(['entry.js', 'app.css', 'router.js', 'shared.js']);
  });
  it('fails closed for a broken dependency graph', () => {
    expect(() =>
      initialFiles({
        entry: { isEntry: true, file: 'main.js', imports: ['missing'] },
      }),
    ).toThrow('Missing manifest dependency');
    expect(() => initialFiles({})).toThrow('exactly one');
  });
});
