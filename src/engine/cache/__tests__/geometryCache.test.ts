import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeometryCache } from '../createGeometryCache';
import { createGeometryCollectionCache } from '../createGeometryCollectionCache';

function disposable() {
  return {
    disposed: false,
    dispose() {
      this.disposed = true;
    },
  };
}

test('cache reuses geometry for matching revision', () => {
  const cache = createGeometryCache<ReturnType<typeof disposable>>();
  const value = disposable();
  cache.set(3, value);
  assert.equal(cache.get(3), value);
});

test('cache invalidates geometry for changed revision', () => {
  const cache = createGeometryCache<ReturnType<typeof disposable>>();
  cache.set(3, disposable());
  assert.equal(cache.get(4), null);
});

test('replacing geometry disposes old geometry', () => {
  const cache = createGeometryCache<ReturnType<typeof disposable>>();
  const first = disposable();
  const second = disposable();
  cache.set(1, first);
  cache.set(2, second);
  assert.equal(first.disposed, true);
  assert.equal(second.disposed, false);
});

test('clearing cache disposes geometry', () => {
  const cache = createGeometryCache<ReturnType<typeof disposable>>();
  const first = disposable();
  cache.set(1, first);
  cache.clear();
  assert.equal(first.disposed, true);
});

test('collection cache supports multiple keys', () => {
  const cache = createGeometryCollectionCache<ReturnType<typeof disposable>>();
  const a = disposable();
  const b = disposable();
  cache.set('walls', 1, a);
  cache.set('roof', 1, b);
  assert.equal(cache.get('walls', 1), a);
  assert.equal(cache.get('roof', 1), b);
});
