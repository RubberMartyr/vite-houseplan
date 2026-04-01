import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const RENDER_ROOT = join(process.cwd(), 'src', 'engine', 'render');
const CODE_EXTENSIONS = new Set(['.ts', '.tsx']);

const BLOCKED_PATTERNS = [
  /src\/engine\/architecturalHouse\.ts$/,
  /src\/model\//,
  /src\/engine\/legacy\//,
  /^\.\.\/architecturalHouse$/,
  /^\.\.\/\.\.\/model\//,
  /^\.\.\/legacy\//,
];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(abs));
    if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) files.push(abs);
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
    for (const m of content.matchAll(regex)) matches.push(m[1]);
  }

  return matches;
}

const violations = [];

for (const file of walk(RENDER_ROOT)) {
  const rel = relative(process.cwd(), file).replaceAll('\\\\', '/');
  const specs = importSpecifiers(readFileSync(file, 'utf8'));

  for (const spec of specs) {
    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(spec))) {
      violations.push(`${rel} imports blocked path ${spec}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Render architectural import guard failed.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Render architectural import guard passed.');
