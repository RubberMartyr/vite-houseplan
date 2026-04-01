export type CachedGeometryEntry<T> = {
  revision: number;
  value: T;
};

export type GeometryCache<T> = {
  get(revision: number): T | null;
  set(revision: number, value: T): void;
  clear(): void;
  dispose(): void;
};

export function createGeometryCache<T extends { dispose?: () => void }>(): GeometryCache<T> {
  let current: CachedGeometryEntry<T> | null = null;

  return {
    get(revision) {
      if (!current || current.revision !== revision) {
        return null;
      }

      return current.value;
    },

    set(revision, value) {
      if (current?.value && current.value !== value) {
        current.value.dispose?.();
      }

      current = {
        revision,
        value,
      };
    },

    clear() {
      current?.value?.dispose?.();
      current = null;
    },

    dispose() {
      current?.value?.dispose?.();
      current = null;
    },
  };
}
