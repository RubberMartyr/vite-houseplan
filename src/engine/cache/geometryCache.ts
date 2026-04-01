import { createGeometryCache } from './createGeometryCache';

type CacheKey = string | number;

type DisposableValue<T> = T & { dispose?: () => void };

export function createLegacyGeometryCache<T>() {
  const cache = createGeometryCache<DisposableValue<T>>();

  return function getOrBuild(revision: CacheKey, builder: () => DisposableValue<T>): DisposableValue<T> {
    const numericRevision = typeof revision === 'number' ? revision : hashRevision(revision);
    const cached = cache.get(numericRevision);
    if (cached) {
      return cached;
    }

    const geometry = builder();
    cache.set(numericRevision, geometry);
    return geometry;
  };
}

function hashRevision(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return hash;
}
