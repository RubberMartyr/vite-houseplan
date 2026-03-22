import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { DerivedWallSegment } from '../deriveWalls';
import {
  createSeparatorDebugMetadata,
  isSeparatorCandidatePiece,
  logSeparatorDebug,
} from '../debug/separatorDebug';
import { debugFlags } from '../debug/debugFlags';

const EPSILON = 1e-6;
const CUT_EPSILON = 0.002;
const STACK_CONTACT_TOLERANCE = 0.01;
const SEPARATOR_HEIGHT = 0.2;
const DEBUG_CELL_MIN_HEIGHT = 0.05;
const SPANDREL_DEBUG_MIN = 2.45;
const SPANDREL_DEBUG_MAX = 3.05;

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

interface VerticalMergeBand {
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

function dedupeCuts(values: number[]) {
  return values.filter((value, index, arr) => index === 0 || Math.abs(value - arr[index - 1]) > CUT_EPSILON);
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

function shouldKeepStackSeparator(lowerOpening: DerivedOpening, upperOpening: DerivedOpening) {
  return upperOpening.style.mergeWithBelow !== true;
}

function buildVerticalMergeBand(lowerOpening: DerivedOpening, upperOpening: DerivedOpening): VerticalMergeBand | null {
  if (upperOpening.style.mergeWithBelow !== true) {
    return null;
  }

  const overlap = getOverlapRange(lowerOpening.uMin, lowerOpening.uMax, upperOpening.uMin, upperOpening.uMax);
  if (overlap.max - overlap.min <= EPSILON) {
    return null;
  }

  const vMin = lowerOpening.vMax;
  const vMax = upperOpening.vMin;
  if (vMax - vMin <= EPSILON) {
    return null;
  }

  return {
    uMin: overlap.min,
    uMax: overlap.max,
    vMin,
    vMax,
    key: [
      lowerOpening.id,
      upperOpening.id,
      overlap.min.toFixed(6),
      overlap.max.toFixed(6),
      vMin.toFixed(6),
      vMax.toFixed(6),
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

function cellFitsInsideMergeBand(cell: WallPieceRect, mergeBand: VerticalMergeBand) {
  return (
    cell.uMin >= mergeBand.uMin - EPSILON &&
    cell.uMax <= mergeBand.uMax + EPSILON &&
    cell.vMin >= mergeBand.vMin - EPSILON &&
    cell.vMax <= mergeBand.vMax + EPSILON
  );
}

export function splitWallByOpenings(
  wallLength: number,
  wallHeight: number,
  openings: DerivedOpening[],
  wall?: Pick<DerivedWallSegment, 'id' | 'levelId'> & { edgeIndex?: number }
): WallPieceRect[] {
  const debugEnabled = debugFlags.enabled;

  if (!openings.length) {
    return [{ uMin: 0, uMax: wallLength, vMin: 0, vMax: wallHeight }];
  }

  const uCuts = new Set<number>([0, wallLength]);
  const vCuts = new Set<number>([0, wallHeight]);
  const stackSeparators = new Map<string, StackSeparatorBand>();
  const verticalMergeBands = new Map<string, VerticalMergeBand>();

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
      const mergeBand = buildVerticalMergeBand(lowerOpening, upperOpening);
      if (mergeBand) {
        verticalMergeBands.set(mergeBand.key, mergeBand);
        uCuts.add(mergeBand.uMin);
        uCuts.add(mergeBand.uMax);
      }

      if (Math.abs(lowerOpening.vMax - upperOpening.vMin) < STACK_CONTACT_TOLERANCE) {
        if (!shouldKeepStackSeparator(lowerOpening, upperOpening)) {
          continue;
        }

        addStackSeparatorCuts(vCuts, wallHeight, lowerOpening.vMax);
        const separator = buildStackSeparatorBand(wallHeight, lowerOpening, upperOpening);
        if (separator) {
          stackSeparators.set(separator.key, separator);
        }
      }
    }
  }

  const uSorted = uniqueSorted([...uCuts]);
  const vSorted = dedupeCuts(uniqueSorted([...vCuts]));
  const separatorBands = [...stackSeparators.values()];
  const mergeBands = [...verticalMergeBands.values()];
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
      const height = piece.vMax - piece.vMin;

      const area = (piece.uMax - piece.uMin) * (piece.vMax - piece.vMin);
      if (area <= EPSILON) continue;

      if (debugEnabled && height > DEBUG_CELL_MIN_HEIGHT) {
        console.log('[WALL CELL]', {
          wallId: wall?.id,
          vMin: piece.vMin,
          vMax: piece.vMax,
          height,
          isBetweenOpenings: true,
        });
      }

      if (debugEnabled && piece.vMin < SPANDREL_DEBUG_MAX && piece.vMax > SPANDREL_DEBUG_MIN) {
        console.log('[SPANDREL DETECTED]', {
          wallId: wall?.id,
          vMin: piece.vMin,
          vMax: piece.vMax,
        });
      }

      const separator = separatorBands.find((candidate) => cellFitsInsideSeparatorBand(cell, candidate));
      const mergeBand = mergeBands.find((candidate) => cellFitsInsideMergeBand(cell, candidate));
      const overlappingOpenings = openings.filter((opening) => {
        if (!cellOverlapsOpening(cell, opening)) {
          return false;
        }

        if (separator && openingTouchesSeparatorBoundary(opening, separator)) {
          return false;
        }

        return true;
      });
      const isOpening = overlappingOpenings.length > 0 || Boolean(mergeBand);

      if (isSeparatorCandidatePiece(piece)) {
        logSeparatorDebug(
          debugEnabled,
          createSeparatorDebugMetadata('splitWallByOpenings:cell-evaluated', wall?.id ?? 'unknown-wall', piece, {
            levelId: wall?.levelId,
            edgeIndex: wall?.edgeIndex,
            addedToReturnedPieces: !isOpening,
            overlappingOpeningIds: overlappingOpenings.map((opening) => opening.id),
            separatorBandMatched: Boolean(separator),
            mergeBandMatched: Boolean(mergeBand),
          })
        );
      }

      if (isOpening) continue;

      pieces.push(piece);
    }
  }

  for (const [pieceIndex, piece] of pieces.entries()) {
    if (!isSeparatorCandidatePiece(piece)) {
      continue;
    }

    logSeparatorDebug(
      debugEnabled,
      createSeparatorDebugMetadata('splitWallByOpenings:return-piece', wall?.id ?? 'unknown-wall', piece, {
        pieceId: wall ? `${wall.id}-piece-${pieceIndex}` : undefined,
        levelId: wall?.levelId,
        edgeIndex: wall?.edgeIndex,
        returnedPieceCount: pieces.length,
      })
    );
  }

  return pieces;
}
