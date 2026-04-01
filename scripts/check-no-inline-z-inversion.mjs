import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');

const ignoredFiles = ['spaceMapping.ts'];

const forbiddenPatterns = [
  /\{\s*x:\s*([a-zA-Z0-9_]+)\.x,\s*z:\s*-\s*\1\.z\s*\}/gs,
  /new THREE\.Vector3\([^)]*-\s*[a-zA-Z0-9_]+\.z[^)]*\)/g,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
      continue;
    }

    if (ignoredFiles.some((name) => fullPath.endsWith(name))) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    for (const pattern of forbiddenPatterns) {
      const matches = content.match(pattern);

      if (matches?.length) {
        console.error(`Forbidden inline Z inversion found in ${fullPath}`);
        console.error(`Pattern: ${pattern}`);
        process.exitCode = 1;
      }
    }
  }
}

walk(ROOT);

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('No forbidden inline Z inversions found.');
