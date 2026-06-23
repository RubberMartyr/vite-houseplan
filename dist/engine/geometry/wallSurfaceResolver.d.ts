export declare function debugDumpEnvelopeEdges(): void;
export declare function debugWallIntersectionsAtZ(zQuery: number): {
    x: number;
    a: {
        x: number;
        z: number;
    };
    b: {
        x: number;
        z: number;
    };
}[];
export declare function getOuterWallHitAtZ(outward: 1 | -1, zQuery: number): {
    xOuter: number;
    tangentXZ: {
        x: number;
        z: number;
    };
};
export declare function getOuterWallXAtZ(outward: 1 | -1, zQuery: number): number;
export declare function getWallPlanesAtZ(outward: 1 | -1, z: number, thickness: number): {
    xOuter: number;
    xInner: number;
    tangentXZ: {
        x: number;
        z: number;
    };
};
