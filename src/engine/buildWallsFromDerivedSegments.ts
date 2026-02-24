import * as THREE from 'three';
import type { DerivedWallSegment } from './deriveWalls';
import { extrudeWallSegment } from './extrudeWallSegment';

export type BuiltWall = {
  id: string;
  geometry: THREE.BufferGeometry;
};

export function buildWallsFromDerivedSegments(segments: DerivedWallSegment[]): BuiltWall[] {
  return segments.map((seg) => ({
    id: seg.id,
    geometry: extrudeWallSegment(seg),
  }));
}
