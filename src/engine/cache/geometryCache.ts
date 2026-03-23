type CacheKey = string | number;

type CacheEntry<T> = {
  revision: CacheKey;
  geometry: T;
};

export function createGeometryCache<T>() {
  let cache: CacheEntry<T> | null = null;

  return function getOrBuild(revision: CacheKey, builder: () => T): T {
    if (cache && cache.revision === revision) {
      return cache.geometry;
    }

    const geometry = builder();

    cache = {
      revision,
      geometry,
    };

    return geometry;
  };
}
