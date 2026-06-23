import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
type WallPrismRanges = {
    uMin: number;
    uMax: number;
    vMin: number;
    vMax: number;
};
export declare function buildWallPrismGeometry(wall: DerivedWallSegment, { uMin, uMax, vMin, vMax }: WallPrismRanges, brickScale?: number, footprintOuter?: Vec2[]): THREE.BufferGeometry;
export {};
