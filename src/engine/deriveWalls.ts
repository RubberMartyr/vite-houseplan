import { ArchitecturalHouse, RoofSpec } from "./architecturalTypes";
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
  uOffset: number;
  visibleBaseY?: number;
  visibleHeight?: number;
};

export function getWallVisibleBaseY(segment: DerivedWallSegment): number {
  return segment.visibleBaseY ?? segment.start.y;
}

export function getWallVisibleHeight(segment: DerivedWallSegment): number {
  return segment.visibleHeight ?? segment.height;
}

export function getWallVisibleTopY(segment: DerivedWallSegment): number {
  return getWallVisibleBaseY(segment) + getWallVisibleHeight(segment);
}

function edgeKey(start: { x: number; z: number }, end: { x: number; z: number }): string {
  return `${start.x},${start.z}->${end.x},${end.z}`;
}

type RoofWallCap = {
  structuralTopY: number;
  edgeKeys: Set<string>;
};

function isRoofBearingSpec(roof: RoofSpec): boolean {
  return roof.type !== 'flat';
}

function buildRoofWallCaps(arch: ArchitecturalHouse): Map<string, RoofWallCap> {
  const caps = new Map<string, RoofWallCap>();

  for (const roof of arch.roofs ?? []) {
    if (!isRoofBearingSpec(roof)) continue;

    const baseLevel = arch.levels.find((level) => level.id === roof.baseLevelId);
    if (!baseLevel) continue;

    const edgeKeys = new Set<string>();
    const outer = baseLevel.footprint.outer;
    for (let i = 0; i < outer.length; i += 1) {
      const current = outer[i];
      const next = outer[(i + 1) % outer.length];
      edgeKeys.add(edgeKey(current, next));
    }

    const cap = caps.get(baseLevel.id);
    const structuralTopY = baseLevel.elevation + baseLevel.height;
    if (!cap) {
      caps.set(baseLevel.id, {
        structuralTopY,
        edgeKeys,
      });
      continue;
    }

    for (const key of edgeKeys) {
      cap.edgeKeys.add(key);
    }
  }

  return caps;
}

export function deriveWallSegmentsFromLevels(
  arch: ArchitecturalHouse
): DerivedWallSegment[] {
  const segments: DerivedWallSegment[] = [];
  const roofWallCaps = buildRoofWallCaps(arch);

  for (const level of arch.levels) {
    const outer = level.footprint.outer;
    const area = signedAreaXZ(outer);
    const isCCW = area > 0;
    const outwardSign: 1 | -1 = isCCW ? -1 : 1;
    const visibleBaseY = level.elevation - level.slab.thickness;
    let uOffset = 0;
    const roofWallCap = roofWallCaps.get(level.id);

    for (let i = 0; i < outer.length; i++) {
      const current = outer[i];
      const next = outer[(i + 1) % outer.length];
      const segmentLength = Math.hypot(next.x - current.x, next.z - current.z);
      const structuralTopY = level.elevation + level.height;
      const visibleTopY = roofWallCap?.edgeKeys.has(edgeKey(current, next))
        ? roofWallCap.structuralTopY
        : structuralTopY;
      const visibleHeight = visibleTopY - visibleBaseY;

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
        uOffset,
        visibleBaseY,
        visibleHeight,
      });

      uOffset += segmentLength;
    }
  }

  return segments;
}
