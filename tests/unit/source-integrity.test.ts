import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('repository guardrails', () => {
  it.each([
    [
      'Complete_with_Docusign_Blundr_PassiveIncomeI.pdf',
      'cf1af44f9e88aa301b5038ae311ffc64296a80cbd8a66e8bedd18298dab33f96',
    ],
    [
      'Copy of Ultimate-DIY-Investing-Package-v8 DRAFT.xlsx',
      '66ea19a3a6adf813d7d3999b4c5202815566be69270c2e875f7fb58e72b077be',
    ],
  ])('preserves the original client document: %s', (filename, hash) => {
    expect(
      createHash('sha256')
        .update(readFileSync(`docs/reference/${filename}`))
        .digest('hex'),
    ).toBe(hash);
  });
  it('quarantines JavaScript to legacy demo code', () => {
    const files = readdirSync('apps/web/src', { recursive: true }).map(String);
    expect(
      files.filter(
        (file) => /\.jsx?$/.test(file) && !file.startsWith('demo/legacy/'),
      ),
    ).toEqual([]);
  });
  it('has one root lockfile for all workspaces', () => {
    const workspace = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      packages: Record<string, unknown>;
    };
    expect(workspace.packages['apps/web']).toBeDefined();
    for (const app of readdirSync('apps')) {
      expect(readdirSync(`apps/${app}`)).not.toContain('package-lock.json');
    }
  });
});
