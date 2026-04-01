import type { DerivedOpeningRect } from '../derive/types/derivedOpenings';

export interface WallSegmentPiece {
  startU: number;
  endU: number;
  bottom: number;
  top: number;
}

export function splitWallByOpenings(
  wallLength: number,
  wallHeight: number,
  openings: DerivedOpeningRect[]
): WallSegmentPiece[] {
  const pieces: WallSegmentPiece[] = [];

  let cursor = 0;

  const sorted = [...openings].sort((a, b) => a.uMin - b.uMin);

  for (const o of sorted) {
    if (o.uMin > cursor) {
      pieces.push({
        startU: cursor,
        endU: o.uMin,
        bottom: 0,
        top: wallHeight,
      });
    }

    // below window
    if (o.vMin > 0) {
      pieces.push({
        startU: o.uMin,
        endU: o.uMax,
        bottom: 0,
        top: o.vMin,
      });
    }

    // above window
    if (o.vMax < wallHeight) {
      pieces.push({
        startU: o.uMin,
        endU: o.uMax,
        bottom: o.vMax,
        top: wallHeight,
      });
    }

    cursor = o.uMax;
  }

  if (cursor < wallLength) {
    pieces.push({
      startU: cursor,
      endU: wallLength,
      bottom: 0,
      top: wallHeight,
    });
  }

  return pieces;
}
