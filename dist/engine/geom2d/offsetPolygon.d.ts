export type Vec2XZ = {
    x: number;
    z: number;
};
export declare function signedAreaXZ(pts: Vec2XZ[]): number;
export declare function offsetPolygonInward(points: Vec2XZ[], offset: number): Vec2XZ[];
