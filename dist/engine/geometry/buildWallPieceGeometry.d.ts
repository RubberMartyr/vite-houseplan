import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import type { WallPieceRect } from '../openings/splitWallByOpenings';
export declare function buildWallPieceGeometry(wall: DerivedWallSegment, piece: WallPieceRect, brickScale?: number, footprintOuter?: Vec2[], pieceId?: string): THREE.BufferGeometry;
