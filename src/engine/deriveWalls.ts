import { ArchitecturalHouse, RoofSpec } from "./architecturalTypes";
import { Vec3 } from "./types";
import { getStructuralWallHeight, getStructuralWallTop } from './derive/getStructuralWallHeight';

const USE_ROOM_DERIVED_INTERIOR_WALLS = true;

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
  kind?: 'interior' | 'exterior';
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
    const structuralTopY =
      baseLevel.elevation + getStructuralWallHeight(arch.levels, arch.levels.indexOf(baseLevel));
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
    const levelIndex = arch.levels.indexOf(level);
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
      const structuralTopY = getStructuralWallTop(arch.levels, levelIndex);
      const visibleTopY = roofWallCap?.edgeKeys.has(edgeKey(current, next))
        ? roofWallCap.structuralTopY
        : structuralTopY;
      const visibleHeight = visibleTopY - visibleBaseY;

      segments.push({
        id: `wall-${level.id}-${i}`,
        levelId: level.id,
        kind: 'exterior',
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
        height: getStructuralWallHeight(arch.levels, levelIndex),
        thickness: arch.wallThickness,
        outwardSign,
        uOffset,
        visibleBaseY,
        visibleHeight,
      });

      uOffset += segmentLength;
    }
  }

  // =========================
  // INTERIOR WALLS
  // =========================

  const manualInteriorWalls = arch.interiorWalls ?? [];
  const derivedRoomInteriorWalls = USE_ROOM_DERIVED_INTERIOR_WALLS
    ? deriveInteriorWallsFromRooms(arch)
    : [];

  // Temporary migration mode:
  // - false => existing manual interior wall behavior only (no change).
  // - true => include room-derived interior wall candidates in addition to manual walls.
  const interiorWallsToUse = USE_ROOM_DERIVED_INTERIOR_WALLS
    ? [...manualInteriorWalls, ...derivedRoomInteriorWalls]
    : manualInteriorWalls;

  for (const wall of interiorWallsToUse) {
    const levelIndex = arch.levels.findIndex((l) => l.id === wall.levelId);
    const level = arch.levels[levelIndex];
    if (!level) continue;
    const wallTop = getStructuralWallTop(arch.levels, levelIndex);

    const visibleBaseY = level.elevation - level.slab.thickness;
    const topY = wallTop;
    const visibleHeight = topY - visibleBaseY;

    const segment: DerivedWallSegment = {
      id: wall.id,
      levelId: wall.levelId,
      kind: 'interior',

      start: {
        x: wall.start.x,
        y: visibleBaseY,
        z: wall.start.z,
      },
      end: {
        x: wall.end.x,
        y: visibleBaseY,
        z: wall.end.z,
      },

      height: getStructuralWallHeight(arch.levels, levelIndex),
      thickness: wall.thickness,

      // interior walls don't have footprint orientation
      outwardSign: 1,

      uOffset: 0,
      visibleBaseY,
      visibleHeight,
    };

    segments.push(segment);
  }

  return segments;
}

type InteriorWallLike = {
  id: string;
  levelId: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  thickness: number;
};

function canonicalUndirectedEdgeKey(
  a: { x: number; z: number },
  b: { x: number; z: number }
): string {
  const aKey = `${a.x},${a.z}`;
  const bKey = `${b.x},${b.z}`;
  return aKey <= bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

function deriveInteriorWallsFromRooms(arch: ArchitecturalHouse): InteriorWallLike[] {
  if (!arch.rooms || arch.rooms.length === 0) {
    return [];
  }

  const levelById = new Map(arch.levels.map((level) => [level.id, level]));
  const exteriorEdgeKeysByLevelId = new Map<string, Set<string>>();

  for (const level of arch.levels) {
    const keys = new Set<string>();
    const outer = level.footprint.outer;
    for (let i = 0; i < outer.length; i += 1) {
      const a = outer[i];
      const b = outer[(i + 1) % outer.length];
      keys.add(canonicalUndirectedEdgeKey(a, b));
    }
    exteriorEdgeKeysByLevelId.set(level.id, keys);
  }

  const deduped = new Map<string, InteriorWallLike>();

  for (const room of arch.rooms) {
    const level = levelById.get(room.levelId);
    if (!level) continue;

    const levelExteriorEdgeKeys = exteriorEdgeKeysByLevelId.get(room.levelId);
    if (!levelExteriorEdgeKeys) continue;

    for (let i = 0; i < room.polygon.length; i += 1) {
      if (room.edges[i]?.type !== 'wall') {
        continue;
      }

      const start = room.polygon[i];
      const end = room.polygon[(i + 1) % room.polygon.length];
      const key = canonicalUndirectedEdgeKey(start, end);

      // Preserve exterior shell derivation from level footprints only.
      if (levelExteriorEdgeKeys.has(key)) {
        continue;
      }

      if (!deduped.has(key)) {
        deduped.set(key, {
          id: `room-wall-${room.levelId}-${deduped.size}`,
          levelId: room.levelId,
          start: { x: start.x, z: start.z },
          end: { x: end.x, z: end.z },
          thickness: arch.wallThickness,
        });
      }
    }
  }

  return [...deduped.values()];
}
