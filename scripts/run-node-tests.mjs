import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const entries = [
  'src/engine/coordinate/__tests__/spaceMapping.test.ts',
  'src/engine/walls/__tests__/wallGeometry.test.ts',
  'src/engine/roof/__tests__/roofGeometry.test.ts',
  'src/engine/cache/__tests__/geometryCache.test.ts',
];

const outdir = join(process.cwd(), '.tmp-tests');
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: entries,
  outdir,
  platform: 'node',
  format: 'cjs',
  bundle: true,
  sourcemap: 'inline',
  target: 'node22',
  outExtension: { '.js': '.cjs' },
  logLevel: 'silent',
});

const builtFiles = entries.map((entry) => join(outdir, entry.replace(/^src\/engine\//, '').replace(/\.ts$/, '.cjs')));
const result = spawnSync(process.execPath, ['--test', ...builtFiles], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
