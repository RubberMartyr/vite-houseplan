import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { DerivedWallSegment } from '../deriveWalls';

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
  openings: DerivedOpening[],
  wall?: Pick<DerivedWallSegment, 'id' | 'levelId'> & { edgeIndex?: number }
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
      const cell = {
        uMin: uSorted[ui],
        uMax: uSorted[ui + 1],
        vMin: vSorted[vi],
        vMax: vSorted[vi + 1],
      };
      const piece: WallPieceRect = cell;

      const area = (piece.uMax - piece.uMin) * (piece.vMax - piece.vMin);
      if (area <= EPSILON) continue;

      const wallLabel = wall?.id ?? `${wall?.levelId ?? '?'}-${wall?.edgeIndex ?? '?'}`;

      const overlappingOpenings = openings.filter((o) => cellOverlapsOpening(cell, o));
      const touchingOpenings = openings.filter(
        (o) =>
          Math.abs(cell.vMin - o.vMax) < 0.01 || Math.abs(cell.vMax - o.vMin) < 0.01
      );
      const isOpening = overlappingOpenings.length > 0;
      const interesting =
        wallLabel.includes('LEFT') ||
        overlappingOpenings.some((o) => o.id.startsWith('LEFT_STACK')) ||
        touchingOpenings.some((o) => o.id.startsWith('LEFT_STACK'));

      if (interesting) {
        console.log('LEFT STACK CELL DEBUG', {
          wall: wallLabel,
          cell: {
            uMin: Number(cell.uMin.toFixed(3)),
            uMax: Number(cell.uMax.toFixed(3)),
            vMin: Number(cell.vMin.toFixed(3)),
            vMax: Number(cell.vMax.toFixed(3)),
          },
          isOpening,
          overlappingIds: overlappingOpenings.map((o) => o.id),
          touchingIds: touchingOpenings.map((o) => o.id),
        });
      }

      if (isOpening) continue;

      pieces.push(piece);
    }
  }

  return pieces;
}
