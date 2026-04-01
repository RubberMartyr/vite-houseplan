import { createGeometryCache } from '../createGeometryCache';
import { createGeometryCollectionCache } from '../createGeometryCollectionCache';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createDisposableValue() {
  return {
    disposed: false,
    dispose() {
      this.disposed = true;
    },
  };
}

export function runGeometryCacheTests() {
  const cache = createGeometryCache<ReturnType<typeof createDisposableValue>>();
  const first = createDisposableValue();
  cache.set(1, first);
  assert(cache.get(1) === first, 'cache should return value for matching revision');
  assert(cache.get(2) === null, 'cache should return null for mismatched revision');

  const second = createDisposableValue();
  cache.set(2, second);
  assert(first.disposed, 'replacing cached geometry should dispose previous geometry');

  cache.clear();
  assert(second.disposed, 'clearing cache should dispose geometry');

  const third = createDisposableValue();
  cache.set(3, third);
  cache.dispose();
  assert(third.disposed, 'disposing cache should dispose geometry');

  const collection = createGeometryCollectionCache<ReturnType<typeof createDisposableValue>>();
  const wallGeometry = createDisposableValue();
  const roofGeometry = createDisposableValue();
  collection.set('wall-a', 11, wallGeometry);
  collection.set('roof-a', 21, roofGeometry);
  assert(collection.get('wall-a', 11) === wallGeometry, 'collection cache should support multiple keys');
  assert(collection.get('roof-a', 21) === roofGeometry, 'collection cache should support multiple keys independently');

  const replacement = createDisposableValue();
  collection.set('wall-a', 12, replacement);
  assert(wallGeometry.disposed, 'collection should dispose replaced geometry for an existing key');

  collection.clear('wall-a');
  assert(replacement.disposed, 'collection clear(key) should dispose key geometry');

  collection.dispose();
  assert(roofGeometry.disposed, 'collection dispose should release all geometries');
}

export function runRendererCacheBehaviorTests() {
  const cache = createGeometryCache<ReturnType<typeof createDisposableValue>>();
  let rebuildCount = 0;

  const buildForRevision = (revision: number) => {
    const cached = cache.get(revision);
    if (cached) {
      return cached;
    }

    rebuildCount += 1;
    const value = createDisposableValue();
    cache.set(revision, value);
    return value;
  };

  const a = buildForRevision(1);
  const b = buildForRevision(1);
  const c = buildForRevision(2);

  assert(a === b, 'renderer cache should reuse value when revision is unchanged');
  assert(rebuildCount === 2, 'renderer cache should only rebuild when revision changes');
  assert(a.disposed, 'renderer cache should dispose prior revision geometry when replaced');
  assert(!c.disposed, 'latest geometry should remain active');

  cache.dispose();
}
