import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WARN_BYTES = Math.round(1.5 * 1024 * 1024);
const FAIL_BYTES = Math.round(2.0 * 1024 * 1024);
const DIST_ASSETS_DIR = join(process.cwd(), 'dist', 'assets');

function readJsBundleSizes() {
  const files = readdirSync(DIST_ASSETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(DIST_ASSETS_DIR, entry.name));

  return files.map((file) => ({
    file,
    bytes: statSync(file).size,
  }));
}

try {
  const bundles = readJsBundleSizes();

  if (bundles.length === 0) {
    console.log('No JS bundles found under dist/assets; skipping bundle size check.');
    process.exit(0);
  }

  const totalBytes = bundles.reduce((sum, bundle) => sum + bundle.bytes, 0);
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);

  if (totalBytes > FAIL_BYTES) {
    console.error(`Bundle size check failed: ${mb} MB exceeds fail threshold 2.00 MB.`);
    process.exit(1);
  }

  if (totalBytes > WARN_BYTES) {
    console.warn(`Bundle size warning: ${mb} MB exceeds warning threshold 1.50 MB.`);
  } else {
    console.log(`Bundle size OK: ${mb} MB.`);
  }
} catch (error) {
  console.error('Bundle size check failed to run:', error);
  process.exit(1);
}
