import { ArchitecturalHouse } from "./architecturalTypes";
import { Vec3 } from "./types";

export type DerivedWallSegment = {
  id: string;
  levelId: string;
  start: Vec3;
  end: Vec3;
  height: number;
  thickness: number;
};

export function deriveWallSegmentsFromLevels(
  arch: ArchitecturalHouse
): DerivedWallSegment[] {
  const segments: DerivedWallSegment[] = [];

  for (const level of arch.levels) {
    const outer = level.footprint.outer;

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
      });
    }
  }

  return segments;
}
