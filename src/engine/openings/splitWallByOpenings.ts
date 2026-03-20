import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { DerivedWallSegment } from '../deriveWalls';

const EPSILON = 1e-6;
const STACK_CONTACT_TOLERANCE = 0.01;
const STACK_SEPARATOR_HALF_GAP = 0.02;

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addStackSeparatorCuts(vCuts: Set<number>, wallHeight: number, boundary: number) {
  const lowerCut = clamp(boundary - STACK_SEPARATOR_HALF_GAP, 0, wallHeight);
  const upperCut = clamp(boundary + STACK_SEPARATOR_HALF_GAP, 0, wallHeight);

  vCuts.add(lowerCut);
  vCuts.add(upperCut);
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

  for (let index = 0; index < openings.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < openings.length; compareIndex += 1) {
      const opening = openings[index];
      const otherOpening = openings[compareIndex];

      if (Math.abs(opening.vMax - otherOpening.vMin) < STACK_CONTACT_TOLERANCE) {
        addStackSeparatorCuts(vCuts, wallHeight, opening.vMax);
      }

      if (Math.abs(otherOpening.vMax - opening.vMin) < STACK_CONTACT_TOLERANCE) {
        addStackSeparatorCuts(vCuts, wallHeight, otherOpening.vMax);
      }
    }
  }

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

      const overlappingOpenings = openings.filter((o) => cellOverlapsOpening(cell, o));
      const isOpening = overlappingOpenings.length > 0;

      if (isOpening) continue;

      pieces.push(piece);
    }
  }

  return pieces;
}
