export type DebugFlags = {
    enabled: boolean;
    showWireframe: boolean;
    showRoofPlanes: boolean;
    showDerivedGraph: boolean;
    showWallNormals: boolean;
    showOpenings: boolean;
};
export declare function parseDebugFlags(search: string): DebugFlags;
export declare const debugFlags: DebugFlags;
