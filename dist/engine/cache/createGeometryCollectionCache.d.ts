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
export declare function createGeometryCollectionCache<T extends {
    dispose?: () => void;
}>(): GeometryCollectionCache<T>;
