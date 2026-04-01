export type CachedGeometryCollectionEntry<T> = {
  revision: number;
  value: T;
};

export type GeometryCollectionCache<T> = {
  get(key: string, revision: number): T | null;
  set(key: string, revision: number, value: T): void;
  clear(key?: string): void;
  dispose(): void;
};

export function createGeometryCollectionCache<T extends { dispose?: () => void }>(): GeometryCollectionCache<T> {
  const cache = new Map<string, CachedGeometryCollectionEntry<T>>();

  return {
    get(key, revision) {
      const entry = cache.get(key);
      if (!entry || entry.revision !== revision) {
        return null;
      }

      return entry.value;
    },

    set(key, revision, value) {
      const existing = cache.get(key);
      if (existing?.value && existing.value !== value) {
        existing.value.dispose?.();
      }

      cache.set(key, { revision, value });
    },

    clear(key) {
      if (key) {
        const entry = cache.get(key);
        entry?.value?.dispose?.();
        cache.delete(key);
        return;
      }

      cache.forEach((entry) => entry.value.dispose?.());
      cache.clear();
    },

    dispose() {
      cache.forEach((entry) => entry.value.dispose?.());
      cache.clear();
    },
  };
}
