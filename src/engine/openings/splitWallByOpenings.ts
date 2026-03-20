import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { DerivedWallSegment } from '../deriveWalls';

const EPSILON = 1e-6;
const STACK_CONTACT_TOLERANCE = 0.01;
const SEPARATOR_HEIGHT = 0.2;

export interface WallPieceRect {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

interface StackSeparatorBand {
  boundary: number;
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  key: string;
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
  const lowerCut = clamp(boundary, 0, wallHeight);
  const upperCut = clamp(boundary + SEPARATOR_HEIGHT, 0, wallHeight);

  vCuts.add(lowerCut);
  vCuts.add(upperCut);
}

function getOverlapRange(aMin: number, aMax: number, bMin: number, bMax: number) {
  return {
    min: Math.max(aMin, bMin),
    max: Math.min(aMax, bMax),
  };
}

function buildStackSeparatorBand(
  wallHeight: number,
  lowerOpening: DerivedOpening,
  upperOpening: DerivedOpening
): StackSeparatorBand | null {
  const overlap = getOverlapRange(lowerOpening.uMin, lowerOpening.uMax, upperOpening.uMin, upperOpening.uMax);
  if (overlap.max - overlap.min <= EPSILON) {
    return null;
  }

  const boundary = lowerOpening.vMax;

  return {
    boundary,
    uMin: overlap.min,
    uMax: overlap.max,
    vMin: clamp(boundary, 0, wallHeight),
    vMax: clamp(boundary + SEPARATOR_HEIGHT, 0, wallHeight),
    key: [
      lowerOpening.id,
      upperOpening.id,
      overlap.min.toFixed(6),
      overlap.max.toFixed(6),
      boundary.toFixed(6),
    ].join('|'),
  };
}

function cellFitsInsideSeparatorBand(cell: WallPieceRect, separator: StackSeparatorBand) {
  return (
    cell.uMin >= separator.uMin - EPSILON &&
    cell.uMax <= separator.uMax + EPSILON &&
    cell.vMin >= separator.vMin - EPSILON &&
    cell.vMax <= separator.vMax + EPSILON
  );
}

function openingTouchesSeparatorBoundary(opening: DerivedOpening, separator: StackSeparatorBand) {
  const touchesBoundary =
    Math.abs(opening.vMax - separator.boundary) < STACK_CONTACT_TOLERANCE ||
    Math.abs(opening.vMin - separator.boundary) < STACK_CONTACT_TOLERANCE;

  if (!touchesBoundary) {
    return false;
  }

  const overlap = getOverlapRange(opening.uMin, opening.uMax, separator.uMin, separator.uMax);
  return overlap.max - overlap.min > EPSILON;
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
  const stackSeparators = new Map<string, StackSeparatorBand>();

  openings.forEach((opening) => {
    uCuts.add(opening.uMin);
    uCuts.add(opening.uMax);
    vCuts.add(opening.vMin);
    vCuts.add(opening.vMax);
  });

  for (let index = 0; index < openings.length; index += 1) {
    for (let compareIndex = 0; compareIndex < openings.length; compareIndex += 1) {
      if (index === compareIndex) continue;

      const lowerOpening = openings[index];
      const upperOpening = openings[compareIndex];

      if (Math.abs(lowerOpening.vMax - upperOpening.vMin) < STACK_CONTACT_TOLERANCE) {
        addStackSeparatorCuts(vCuts, wallHeight, lowerOpening.vMax);
        const separator = buildStackSeparatorBand(wallHeight, lowerOpening, upperOpening);
        if (separator) {
          stackSeparators.set(separator.key, separator);
        }
      }
    }
  }

  const uSorted = uniqueSorted([...uCuts]);
  const vSorted = uniqueSorted([...vCuts]);
  const separatorBands = [...stackSeparators.values()];
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

      const separator = separatorBands.find((candidate) => cellFitsInsideSeparatorBand(cell, candidate));
      const overlappingOpenings = openings.filter((opening) => {
        if (!cellOverlapsOpening(cell, opening)) {
          return false;
        }

        if (separator && openingTouchesSeparatorBoundary(opening, separator)) {
          return false;
        }

        return true;
      });
      const isOpening = overlappingOpenings.length > 0;

      if (isOpening) continue;

      pieces.push(piece);
    }
  }

  return pieces;
}
