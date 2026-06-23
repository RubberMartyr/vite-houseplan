type CacheKey = string | number;
type DisposableValue<T> = T & {
    dispose?: () => void;
};
export declare function createLegacyGeometryCache<T>(): (revision: CacheKey, builder: () => DisposableValue<T>) => DisposableValue<T>;
export {};
