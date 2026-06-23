import * as THREE from 'three';
import type { DerivedWallSegment } from './deriveWalls';
export type BuiltWall = {
    id: string;
    geometry: THREE.BufferGeometry;
};
export declare function buildWallsFromDerivedSegments(segments: DerivedWallSegment[]): BuiltWall[];
