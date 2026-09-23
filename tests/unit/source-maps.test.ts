import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
// @ts-expect-error Plain ESM build tooling, used by Node and Vite.
import { archiveSourceMaps } from '../../scripts/private-source-maps.mjs';
// @ts-expect-error Plain ESM build gate, exercised with real files.
import { verifyBuild } from '../../scripts/check-build.mjs';

it('archives maps with asset hashes and rejects maps that reach public output', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'pii-maps-test-'));
  try {
    const web = path.join(directory, 'dist');
    mkdirSync(path.join(web, 'assets'), { recursive: true });
    mkdirSync(path.join(web, '.vite'));
    writeFileSync(
      path.join(web, '.vite/manifest.json'),
      JSON.stringify({
        'index.html': { isEntry: true, file: 'assets/index-Test123.js' },
      }),
    );
    writeFileSync(
      path.join(web, 'assets/index-Test123.js'),
      'export const x = 1;',
    );
    writeFileSync(
      path.join(web, 'assets/index-Test123.js.map'),
      JSON.stringify({
        version: 3,
        sources: ['source.ts'],
        sourcesContent: ['private-source-code'],
      }),
    );
    expect(() => verifyBuild(web)).toThrow('source map');
    const archive = path.join(directory, 'private');
    expect(archiveSourceMaps(web, archive, 'a'.repeat(40))).toBe(1);
    expect(existsSync(path.join(web, 'assets/index-Test123.js.map'))).toBe(
      false,
    );
    expect(
      readFileSync(
        path.join(archive, 'a'.repeat(40), 'index-Test123.js.map'),
        'utf8',
      ),
    ).toContain('private-source-code');
    const manifest = JSON.parse(
      readFileSync(path.join(archive, 'a'.repeat(40), 'manifest.json'), 'utf8'),
    );
    expect(manifest.assets[0].js_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(() => verifyBuild(web)).not.toThrow();
    expect(() => archiveSourceMaps(web, archive, '../invalid')).toThrow(
      'Invalid source-map release',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
