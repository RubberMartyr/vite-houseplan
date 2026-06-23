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
export declare function createGeometryCache<T extends {
    dispose?: () => void;
}>(): GeometryCache<T>;
