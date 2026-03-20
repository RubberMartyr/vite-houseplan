import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import { debugFlags } from '../debug/debugFlags';
import {
  createSeparatorDebugMetadata,
  isSeparatorCandidatePiece,
  logSeparatorDebug,
} from '../debug/separatorDebug';
import type { DerivedWallSegment } from '../deriveWalls';
import { getWallVisibleBaseY } from '../deriveWalls';
import type { WallPieceRect } from '../openings/splitWallByOpenings';
import { buildWallPrismGeometry } from './buildWallPrismGeometry';

export function buildWallPieceGeometry(
  wall: DerivedWallSegment,
  piece: WallPieceRect,
  brickScale = 0.6,
  footprintOuter?: Vec2[],
  pieceId?: string
): THREE.BufferGeometry {
  const debugEnabled = debugFlags.enabled;

  if (isSeparatorCandidatePiece(piece)) {
    logSeparatorDebug(
      debugEnabled,
      createSeparatorDebugMetadata('buildWallPieceGeometry:create', wall.id, piece, {
        pieceId,
        levelId: wall.levelId,
        wallVisibleBaseY: getWallVisibleBaseY(wall),
        worldVMin: getWallVisibleBaseY(wall) + piece.vMin,
        worldVMax: getWallVisibleBaseY(wall) + piece.vMax,
      })
    );
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
