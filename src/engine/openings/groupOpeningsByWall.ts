import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';

export function groupOpeningsByWall(
  walls: DerivedWallSegment[],
  openings: DerivedOpening[]
): Map<string, DerivedOpening[]> {
  const grouped = new Map<string, DerivedOpening[]>();

  for (const wall of walls) {
    grouped.set(wall.id, []);
  }

  for (const opening of openings) {
    const entries = grouped.get(opening.wallId);
    if (!entries) continue;
    entries.push(opening);
  }

  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.uMin - b.uMin);
  }

  return grouped;
}
