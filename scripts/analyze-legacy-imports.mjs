import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOTS = ['src', 'scripts'];
const ALLOWED_IMPORTS = new Set();
const TARGETS = ['buildHouse', 'toThreeWorldMeshes', 'buildWalls', 'buildRoof'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue;
      }
      files.push(...walk(abs));
      continue;
    }

    if (CODE_EXTENSIONS.has(extname(entry.name))) {
      files.push(abs);
    }
  }

  return files;
}

function collectImportSpecifiers(text) {
  const specs = [];
  const patterns = [
    /import\s+(?:type\s+)?[^'"`]*?from\s*['"]([^'"]+)['"]/g,
    /export\s+[^'"`]*?from\s*['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      specs.push(match[1]);
    }
  }

  return specs;
}

const results = new Map(TARGETS.map((target) => [target, []]));

for (const root of ROOTS) {
  let files = [];
  try {
    files = walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const rel = relative(process.cwd(), file).replaceAll('\\\\', '/');
    const source = readFileSync(file, 'utf8');
    const imports = collectImportSpecifiers(source);

    for (const spec of imports) {
      for (const target of TARGETS) {
        if (!new RegExp(`(^|/)${target}(\\.[a-z0-9]+)?$`).test(spec)) continue;
        results.get(target).push({ file: rel, spec, allowed: ALLOWED_IMPORTS.has(rel) && target === 'buildRoof' });
      }
    }
  }
}

const generatedAt = new Date().toISOString();
console.log(`# Legacy Import Audit\n`);
console.log(`Generated: ${generatedAt}\n`);

let blocked = false;
for (const target of TARGETS) {
  const rows = results.get(target);
  const active = rows.filter((row) => !row.allowed);
  const allowed = rows.filter((row) => row.allowed);

  console.log(`## ${target}`);
  if (active.length === 0 && allowed.length === 0) {
    console.log(`- status: clear`);
  } else {
    if (active.length > 0) {
      blocked = true;
      console.log(`- status: active references (${active.length})`);
      for (const row of active) {
        console.log(`  - ${row.file} -> ${row.spec}`);
      }
    } else {
      console.log(`- status: clear (allowed migration reference only)`);
    }

    if (allowed.length > 0) {
      console.log(`- allowed references (${allowed.length})`);
      for (const row of allowed) {
        console.log(`  - ${row.file} -> ${row.spec}`);
      }
    }
  }

  console.log('');
}

if (blocked) {
  process.exitCode = 1;
}
