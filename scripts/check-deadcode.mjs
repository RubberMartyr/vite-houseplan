import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const blockedDirs = [join(process.cwd(), 'src', 'engine', 'legacy')];
let failed = false;

for (const dir of blockedDirs) {
  if (!existsSync(dir)) continue;
  const entries = readdirSync(dir, { withFileTypes: true });
  const hasCode = entries.some((entry) => entry.isFile() && /\.(ts|tsx|js|mjs|cjs)$/.test(entry.name));

  if (hasCode) {
    console.error(`Dead-code guard failed: legacy code detected in ${dir}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Dead-code guard passed.');
