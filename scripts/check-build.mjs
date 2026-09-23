import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export function initialFiles(manifest) {
  const files = new Set();
  const visited = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing manifest dependency: ${key}`);
    files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  }
  const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry);
  if (entries.length !== 1)
    throw new Error('Expected exactly one web entry point.');
  visit(entries[0][0]);
  return [...files];
}

export function verifyBuild(directory) {
  const manifest = JSON.parse(
    readFileSync(path.join(directory, '.vite/manifest.json'), 'utf8'),
  );
  const initial = initialFiles(manifest);
  const bytes = initial.reduce(
    (sum, file) =>
      sum + gzipSync(readFileSync(path.join(directory, file))).length,
    0,
  );
  // Deliberately a compressed transfer budget, not a claim about runtime speed.
  if (bytes > 200 * 1024)
    throw new Error(`Initial JS + CSS exceeds 200 KiB gzip: ${bytes} bytes`);
  for (const file of readdirSync(directory, { recursive: true })) {
    if (
      /\.(pdf|xlsx|map)$/i.test(file) ||
      /(^|[/\\])reference([/\\]|$)/.test(file)
    ) {
      throw new Error(
        `Private reference artifact or source map in web output: ${file}`,
      );
    }
  }
  console.log(
    `Build gate: ${bytes} bytes gzip initial JS + CSS (budget 204800); no PDF/XLSX reference artifacts.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  verifyBuild(path.resolve('apps/web/dist'));
}
