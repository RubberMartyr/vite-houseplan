import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOTS = ['src', 'scripts'];
const BLOCKED = ['buildHouse', 'toThreeWorldMeshes', 'buildWalls', 'buildRoof'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

const ALLOWLIST = new Map([
  ['src/model/roof.ts', new Set(['buildRoof'])],
]);

function walk(dir) {
  const items = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    if (item.name === 'node_modules' || item.name === 'dist' || item.name.startsWith('.')) continue;

    const abs = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walk(abs));
    } else if (CODE_EXTENSIONS.has(extname(item.name))) {
      files.push(abs);
    }
  }

  return files;
}

function importSpecifiers(content) {
  const matches = [];
  const regexes = [
    /import\s+(?:type\s+)?[^'"`]*?from\s*['"]([^'"]+)['"]/g,
    /export\s+[^'"`]*?from\s*['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const regex of regexes) {
    for (const m of content.matchAll(regex)) {
      matches.push(m[1]);
    }
  }

  return matches;
}

const violations = [];

for (const root of ROOTS) {
  let files = [];
  try {
    files = walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const rel = relative(process.cwd(), file).replaceAll('\\\\', '/');
    const allow = ALLOWLIST.get(rel) ?? new Set();
    const specs = importSpecifiers(readFileSync(file, 'utf8'));

    for (const spec of specs) {
      for (const blocked of BLOCKED) {
        if (!new RegExp(`(^|/)${blocked}(\\.[a-z0-9]+)?$`).test(spec)) continue;
        if (allow.has(blocked)) continue;
        violations.push(`${rel} imports ${spec} (blocked: ${blocked})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Legacy import guard failed.');
  for (const v of violations) {
    console.error(`- ${v}`);
  }
  process.exit(1);
}

console.log('Legacy import guard passed.');
