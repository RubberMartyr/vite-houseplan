import type { BufferGeometry } from 'three';
import type { Vec2 } from './architecturalTypes';
import type { DerivedWallSegment } from './deriveWalls';
export declare function extrudeWallSegment(seg: DerivedWallSegment, brickScale?: number, footprintOuter?: Vec2[]): BufferGeometry;
