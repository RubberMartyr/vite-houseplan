type CacheEntry<T> = {
  revision: number;
  geometry: T;
};

export function createGeometryCache<T>() {
  let cache: CacheEntry<T> | null = null;

  return function getOrBuild(revision: number, builder: () => T): T {
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
