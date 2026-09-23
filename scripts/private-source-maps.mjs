import {
  mkdirSync,
  readdirSync,
  renameSync,
  chmodSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function archiveSourceMaps(directory, archiveRoot, release) {
  if (!/^(local|[a-f0-9]{40})$/.test(release))
    throw new Error('Invalid source-map release.');
  const records = [];
  const archive = path.join(archiveRoot, release);
  mkdirSync(archive, { recursive: true, mode: 0o700 });
  for (const file of readdirSync(path.join(directory, 'assets'))) {
    if (!/^[A-Za-z0-9_-]+\.js\.map$/.test(file)) continue;
    const source = path.join(directory, 'assets', file);
    const js = readFileSync(path.join(directory, 'assets', file.slice(0, -4)));
    const map = readFileSync(source);
    const parsed = JSON.parse(map.toString('utf8'));
    if (parsed.version !== 3 || !Array.isArray(parsed.sources))
      throw new Error('Invalid source map.');
    records.push({
      asset: file.slice(0, -4),
      js_sha256: createHash('sha256').update(js).digest('hex'),
      map_sha256: createHash('sha256').update(map).digest('hex'),
    });
    renameSync(source, path.join(archive, file));
    chmodSync(path.join(archive, file), 0o600);
  }
  if (!records.length) throw new Error('Expected private source maps.');
  writeFileSync(
    path.join(archive, 'manifest.json'),
    JSON.stringify({ release, assets: records }, null, 2),
    { mode: 0o600 },
  );
  return records.length;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const count = archiveSourceMaps(
    'apps/web/dist',
    '.private-artifacts/source-maps',
    process.env.VITE_PII_RELEASE ?? 'local',
  );
  console.log(
    `Archived ${count} browser source maps outside public output. Upload/hosted symbolication still requires release acceptance.`,
  );
}
