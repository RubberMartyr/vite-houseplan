import type { DerivedOpening } from '../derive/types/DerivedOpening';

const EPSILON = 1e-6;

export interface WallPieceRect {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

function uniqueSorted(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v, idx) => idx === 0 || Math.abs(v - sorted[idx - 1]) > EPSILON);
}

function overlaps(a: WallPieceRect, b: DerivedOpening) {
  return a.uMin < b.uMax - EPSILON && b.uMin < a.uMax - EPSILON && a.vMin < b.vMax - EPSILON && b.vMin < a.vMax - EPSILON;
}

export function splitWallByOpenings(
  wallLength: number,
  wallHeight: number,
  openings: DerivedOpening[]
): WallPieceRect[] {
  if (!openings.length) {
    return [{ uMin: 0, uMax: wallLength, vMin: 0, vMax: wallHeight }];
  }

  const uCuts = uniqueSorted([0, wallLength, ...openings.flatMap((o) => [o.uMin, o.uMax])]);
  const vCuts = uniqueSorted([0, wallHeight, ...openings.flatMap((o) => [o.vMin, o.vMax])]);
  const pieces: WallPieceRect[] = [];

  for (let ui = 0; ui < uCuts.length - 1; ui += 1) {
    for (let vi = 0; vi < vCuts.length - 1; vi += 1) {
      const piece: WallPieceRect = {
        uMin: uCuts[ui],
        uMax: uCuts[ui + 1],
        vMin: vCuts[vi],
        vMax: vCuts[vi + 1],
      };

      const area = (piece.uMax - piece.uMin) * (piece.vMax - piece.vMin);
      if (area <= EPSILON) continue;
      if (openings.some((opening) => overlaps(piece, opening))) continue;

      pieces.push(piece);
    }
  }

  return pieces;
}
