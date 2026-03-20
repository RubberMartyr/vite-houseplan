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

function cellOverlapsOpening(cell: WallPieceRect, opening: DerivedOpening) {
  return !(
    cell.uMax <= opening.uMin + EPSILON ||
    cell.uMin >= opening.uMax - EPSILON ||
    cell.vMax <= opening.vMin + EPSILON ||
    cell.vMin >= opening.vMax - EPSILON
  );
}

export function splitWallByOpenings(
  wallLength: number,
  wallHeight: number,
  openings: DerivedOpening[]
): WallPieceRect[] {
  if (!openings.length) {
    return [{ uMin: 0, uMax: wallLength, vMin: 0, vMax: wallHeight }];
  }

  const uCuts = new Set<number>([0, wallLength]);
  const vCuts = new Set<number>([0, wallHeight]);

  openings.forEach((opening) => {
    uCuts.add(opening.uMin);
    uCuts.add(opening.uMax);
    vCuts.add(opening.vMin);
    vCuts.add(opening.vMax);
  });

  const uSorted = uniqueSorted([...uCuts]);
  const vSorted = uniqueSorted([...vCuts]);
  const pieces: WallPieceRect[] = [];

  for (let ui = 0; ui < uSorted.length - 1; ui += 1) {
    for (let vi = 0; vi < vSorted.length - 1; vi += 1) {
      const piece: WallPieceRect = {
        uMin: uSorted[ui],
        uMax: uSorted[ui + 1],
        vMin: vSorted[vi],
        vMax: vSorted[vi + 1],
      };

      const area = (piece.uMax - piece.uMin) * (piece.vMax - piece.vMin);
      if (area <= EPSILON) continue;

      const isOpening = openings.some((opening) => cellOverlapsOpening(piece, opening));
      if (isOpening) continue;

      pieces.push(piece);
    }
  }

  return pieces;
}
