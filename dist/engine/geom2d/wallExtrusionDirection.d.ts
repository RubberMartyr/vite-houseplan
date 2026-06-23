import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
type Vec2XZ = {
    x: number;
    z: number;
};
export type WallDirectionVectors = {
    length: number;
    tangent: Vec2XZ;
    outward: Vec2XZ;
    inward: Vec2XZ;
};
export declare function resolveWallExtrusionDirection(wall: DerivedWallSegment, footprintOuter?: Vec2[]): WallDirectionVectors | null;
export {};
