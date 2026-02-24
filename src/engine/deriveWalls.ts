import { ArchitecturalHouse } from "./architecturalTypes";
import { Vec3 } from "./types";

function signedAreaXZ(pts: { x: number; z: number }[]): number {
  let a = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const n = pts[(i + 1) % pts.length];
    a += p.x * n.z - n.x * p.z;
  }

  return a / 2;
}

export type DerivedWallSegment = {
  id: string;
  levelId: string;
  start: Vec3;
  end: Vec3;
  height: number;
  thickness: number;
  outwardSign: 1 | -1;
};

export function deriveWallSegmentsFromLevels(
  arch: ArchitecturalHouse
): DerivedWallSegment[] {
  const segments: DerivedWallSegment[] = [];

  for (const level of arch.levels) {
    const outer = level.footprint.outer;
    const area = signedAreaXZ(outer);
    const isCCW = area > 0;
    const outwardSign: 1 | -1 = isCCW ? -1 : 1;

    for (let i = 0; i < outer.length; i++) {
      const current = outer[i];
      const next = outer[(i + 1) % outer.length];

      segments.push({
        id: `wall-${level.id}-${i}`,
        levelId: level.id,
        start: {
          x: current.x,
          y: level.elevation,
          z: current.z,
        },
        end: {
          x: next.x,
          y: level.elevation,
          z: next.z,
        },
        height: level.height,
        thickness: arch.wallThickness,
        outwardSign,
      });
    }
  }

  return segments;
}
