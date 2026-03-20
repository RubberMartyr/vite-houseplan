import type { WallPieceRect } from '../openings/splitWallByOpenings';

export const SEPARATOR_DEBUG_MIN_HEIGHT = 0.05;
export const SEPARATOR_DEBUG_MAX_HEIGHT = 0.4;

export type SeparatorDebugMetadata = {
  wallId: string;
  pieceId?: string;
  stage: string;
  vMin: number;
  vMax: number;
  height: number;
  uMin?: number;
  uMax?: number;
  [key: string]: unknown;
};

export function isSeparatorCandidatePiece(piece: Pick<WallPieceRect, 'vMin' | 'vMax'>): boolean {
  const height = piece.vMax - piece.vMin;
  return height > SEPARATOR_DEBUG_MIN_HEIGHT && height < SEPARATOR_DEBUG_MAX_HEIGHT;
}

export function createSeparatorDebugMetadata(
  stage: string,
  wallId: string,
  piece: WallPieceRect,
  extras: Omit<SeparatorDebugMetadata, 'stage' | 'wallId' | 'vMin' | 'vMax' | 'height' | 'uMin' | 'uMax'> = {}
): SeparatorDebugMetadata {
  return {
    stage,
    wallId,
    vMin: piece.vMin,
    vMax: piece.vMax,
    height: piece.vMax - piece.vMin,
    uMin: piece.uMin,
    uMax: piece.uMax,
    ...extras,
  };
}

export function logSeparatorDebug(enabled: boolean, metadata: SeparatorDebugMetadata): void {
  if (!enabled) {
    return;
  }

  console.debug('[separator-debug]', metadata);
}
