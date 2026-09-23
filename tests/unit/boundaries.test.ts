import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();
async function boundaryErrors(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint did not inspect the module.');
  return result.messages.filter(
    (message) => message.ruleId === 'boundaries/browser',
  );
}

describe('browser import boundaries', () => {
  it.each([
    "import '../demo/legacy/data/dummy';",
    "export * from '../demo/legacy/data/dummy';",
    "void import('../demo/legacy/views/Home');",
    "import '../demo/HomeRoute';",
    "import 'node:fs';",
    "import 'fs/promises';",
    "import '@pii/server';",
    "import '../../../../api/profile';",
    "import '../../../../docs/reference/agreement.txt?raw';",
    "require('../demo/legacy/data/dummy');",
    'void import(destination);',
  ])('rejects unsafe production dependency: %s', async (code) => {
    expect(
      await boundaryErrors(code, 'apps/web/src/app/Member.tsx'),
    ).toHaveLength(1);
  });
  it('also rejects a router importing legacy fixtures directly', async () => {
    expect(
      await boundaryErrors(
        "import '../demo/legacy/data/dummy';",
        'apps/web/src/app/router.tsx',
      ),
    ).toHaveLength(1);
  });
  it('keeps demo code out of the eager router bundle', async () => {
    expect(
      await boundaryErrors(
        "import '../demo/HomeRoute';",
        'apps/web/src/app/router.tsx',
      ),
    ).toHaveLength(1);
  });
  it.each([
    ["void import('../demo/HomeRoute');", 'apps/web/src/app/router.tsx'],
    ["import './legacy/views/Home';", 'apps/web/src/demo/HomeRoute.tsx'],
    ["import '../data/dummy';", 'apps/web/src/demo/legacy/views/Home.jsx'],
    ["import 'react';", 'apps/web/src/app/Member.tsx'],
  ])('allows intended boundary: %s', async (code, filePath) => {
    expect(await boundaryErrors(code, filePath)).toHaveLength(0);
  });
});
