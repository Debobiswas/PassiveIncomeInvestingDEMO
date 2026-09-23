import path from 'node:path';
import { builtinModules } from 'node:module';

const builtins = new Set(
  builtinModules.map((name) => name.replace(/^node:/, '')),
);

export default {
  rules: {
    browser: {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          forbidden:
            'Browser code must not import server, Node, or legacy fixture modules outside their boundary.',
          static:
            'Module paths must be static strings so boundary checks can verify them.',
        },
      },
      create(context) {
        const filename = context.filename.replaceAll('\\', '/');
        const isDemo = filename.includes('/src/demo/');
        const isRouter = filename.endsWith('/src/app/router.tsx');
        function check(node, source) {
          if (!source || typeof source.value !== 'string') {
            context.report({ node, messageId: 'static' });
            return;
          }
          const specifier = source.value;
          const resolved = specifier.startsWith('.')
            ? path
                .resolve(path.dirname(filename), specifier)
                .replaceAll('\\', '/')
            : specifier;
          const server =
            specifier.startsWith('node:') ||
            builtins.has(specifier) ||
            /(^|\/)(server|api|worker)(\/|$)/.test(resolved) ||
            /^@pii\/(server|worker)(\/|$)/.test(specifier);
          // Only demo code may import fixtures. The router may load the typed demo
          // entry points, never a legacy screen or fixture directly.
          const legacy = resolved.includes('/demo/legacy/');
          const demo = resolved.includes('/src/demo/');
          const privateReference = resolved.includes('/docs/reference/');
          if (
            server ||
            privateReference ||
            (legacy && !isDemo) ||
            (demo &&
              !isDemo &&
              !(isRouter && !legacy && node.type === 'ImportExpression'))
          ) {
            context.report({ node, messageId: 'forbidden' });
          }
        }
        return {
          ImportDeclaration: (node) => check(node, node.source),
          ExportNamedDeclaration: (node) => {
            if (node.source) check(node, node.source);
          },
          ExportAllDeclaration: (node) => check(node, node.source),
          ImportExpression: (node) => check(node, node.source),
          CallExpression: (node) => {
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'require'
            )
              check(node, node.arguments[0]);
          },
        };
      },
    },
  },
};
