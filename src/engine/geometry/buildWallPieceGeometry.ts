import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import { getWallVisibleBaseY } from '../deriveWalls';
import type { WallPieceRect } from '../openings/splitWallByOpenings';
import { buildWallPrismGeometry } from './buildWallPrismGeometry';

export function buildWallPieceGeometry(
  wall: DerivedWallSegment,
  piece: WallPieceRect,
  brickScale = 0.6,
  footprintOuter?: Vec2[]
): THREE.BufferGeometry {
  const { vMin, vMax } = piece;
  const height = vMax - vMin;

  console.log('BUILD WALL PIECE', {
    vMin,
    vMax,
    height,
  });

  if (height < 0.3) {
    console.warn('SMALL WALL PIECE (separator?)', {
      vMin,
      vMax,
      height,
    });
  }

  const wallBaseY = getWallVisibleBaseY(wall);

  return buildWallPrismGeometry(
    wall,
    {
      uMin: piece.uMin,
      uMax: piece.uMax,
      vMin: wallBaseY + piece.vMin,
      vMax: wallBaseY + piece.vMax,
    },
    brickScale,
    footprintOuter
  );
}
