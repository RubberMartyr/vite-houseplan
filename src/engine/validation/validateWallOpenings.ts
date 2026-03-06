import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';

const EPSILON = 1e-6;

function overlaps1d(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 - EPSILON && b0 < a1 - EPSILON;
}

export function validateWallOpenings(walls: DerivedWallSegment[], openings: DerivedOpening[]) {
  const wallById = new Map(walls.map((wall) => [wall.id, wall]));
  const byWall = new Map<string, DerivedOpening[]>();

  for (const opening of openings) {
    if (!(opening.uMin < opening.uMax) || !(opening.vMin < opening.vMax)) {
      throw new Error(`Opening ${opening.id}: invalid opening bounds.`);
    }

    if (opening.width <= EPSILON || opening.height <= EPSILON) {
      throw new Error(`Opening ${opening.id}: width/height must be > ${EPSILON}.`);
    }

    const wall = wallById.get(opening.wallId);
    if (!wall) {
      throw new Error(`Opening ${opening.id}: referenced wallId ${opening.wallId} was not derived.`);
    }

    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    if (opening.uMin < -EPSILON || opening.uMax > wallLength + EPSILON) {
      throw new Error(`Opening ${opening.id}: opening lies outside wall length bounds.`);
    }

    if (opening.vMin < -EPSILON || opening.vMax > wall.height + EPSILON) {
      throw new Error(`Opening ${opening.id}: opening lies outside wall height bounds.`);
    }

    const entries = byWall.get(opening.wallId) ?? [];
    entries.push(opening);
    byWall.set(opening.wallId, entries);
  }

  for (const [wallId, wallOpenings] of byWall) {
    const sorted = [...wallOpenings].sort((a, b) => (a.uMin - b.uMin) || (a.vMin - b.vMin));

    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i];
        const b = sorted[j];
        if (b.uMin >= a.uMax - EPSILON) {
          break;
        }

        if (overlaps1d(a.uMin, a.uMax, b.uMin, b.uMax) && overlaps1d(a.vMin, a.vMax, b.vMin, b.vMax)) {
          throw new Error(`Openings ${a.id} and ${b.id} overlap on wall ${wallId}.`);
        }
      }
    }
  }
}
