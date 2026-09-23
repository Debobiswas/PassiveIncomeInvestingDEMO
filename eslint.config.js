import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import boundaries from './scripts/eslint-boundaries.mjs';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.claude/**',
      '.superpowers/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    files: ['packages/contracts/src/**/*.ts'],
    plugins: { boundaries },
    rules: {
      'boundaries/browser': 'error',
      'no-restricted-globals': [
        'error',
        'process',
        'Buffer',
        '__dirname',
        '__filename',
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', '@supabase/*', '@pii/server/*'] },
      ],
    },
  },
  {
    files: ['api/**/*.ts', 'packages/server/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/apps/web/**',
            '**/demo/**',
            '@pii/contracts/*',
            '@pii/server/*',
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'boundaries/browser': 'error',
      'no-restricted-globals': [
        'error',
        'process',
        'Buffer',
        '__dirname',
        '__filename',
      ],
    },
  },
  {
    files: ['apps/web/src/demo/legacy/**/*.{js,jsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
    },
  },
);
