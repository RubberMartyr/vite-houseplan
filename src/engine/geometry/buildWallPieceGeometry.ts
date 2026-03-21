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

const STACK_SEPARATOR_DEPTH = 0.1;

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
        separatorDepth: Math.min(STACK_SEPARATOR_DEPTH, wall.thickness),
        separatorNormalOffset: Math.max(wall.thickness - Math.min(STACK_SEPARATOR_DEPTH, wall.thickness), 0),
      })
    );
  }

  const wallBaseY = getWallVisibleBaseY(wall);

  const separatorCandidate = isSeparatorCandidatePiece(piece);
  const separatorDepth = Math.min(STACK_SEPARATOR_DEPTH, wall.thickness);
  const separatorNormalOffset = Math.max(wall.thickness - separatorDepth, 0);

  return buildWallPrismGeometry(
    wall,
    {
      uMin: piece.uMin,
      uMax: piece.uMax,
      vMin: wallBaseY + piece.vMin,
      vMax: wallBaseY + piece.vMax,
    },
    brickScale,
    footprintOuter,
    separatorCandidate
      ? {
          depth: separatorDepth,
          normalOffset: separatorNormalOffset,
        }
      : undefined
  );
}
