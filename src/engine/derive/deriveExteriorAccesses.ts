import type { ArchitecturalHouse, ExteriorAccessSpec, Vec2, Vec3 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedExteriorAccessCutout, DerivedExteriorAccessPart } from './types/DerivedExteriorAccess';
import { isPointInsidePolygonXZ } from './deriveOpenings';

const OUTWARD_PROBE_DISTANCE = 0.05;
const EPSILON = 1e-9;
const DEFAULT_FLOOR_THICKNESS = 0.18;
const DEFAULT_WALL_THICKNESS = 0.2;

type DeriveExteriorAccessesContext = {
  walls: DerivedWallSegment[];
};

function polygonSignedAreaXZ(points: Vec2[]): number {
  let area2 = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area2 += current.x * next.z - next.x * current.z;
  }

  return area2 / 2;
}

function pickOutwardNormalXZ(outer: Vec2[], edgeMidpoint: Vec2, n1: Vec2, n2: Vec2): Vec2 {
  const ccw = polygonSignedAreaXZ(outer) > 0;
  const preferred = ccw ? n2 : n1;
  const fallback = ccw ? n1 : n2;

  const preferredProbe = {
    x: edgeMidpoint.x + preferred.x * OUTWARD_PROBE_DISTANCE,
    z: edgeMidpoint.z + preferred.z * OUTWARD_PROBE_DISTANCE,
  };

  if (!isPointInsidePolygonXZ(outer, preferredProbe)) {
    return preferred;
  }

  const fallbackProbe = {
    x: edgeMidpoint.x + fallback.x * OUTWARD_PROBE_DISTANCE,
    z: edgeMidpoint.z + fallback.z * OUTWARD_PROBE_DISTANCE,
  };

  if (!isPointInsidePolygonXZ(outer, fallbackProbe)) {
    return fallback;
  }

  return preferred;
}

function resolveEdgePlacement(level: ArchitecturalHouse['levels'][number], spec: ExteriorAccessSpec) {
  const outer = level.footprint.outer;
  const edgeIndex = spec.edge.edgeIndex;
  const start = outer[edgeIndex];
  const end = outer[(edgeIndex + 1) % outer.length];
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const edgeLength = Math.hypot(dx, dz);

  if (edgeLength <= EPSILON) {
    throw new Error(`Exterior access ${spec.id}: host edge has zero length.`);
  }

  const tangentXZ = { x: dx / edgeLength, z: dz / edgeLength };
  const wellLength = spec.landingLength + spec.stairRun;
  const uMin = spec.edge.fromEnd
    ? edgeLength - (spec.offset + wellLength)
    : spec.offset;
  const uMax = uMin + wellLength;

  if (uMin < -EPSILON || uMax > edgeLength + EPSILON) {
    throw new Error(`Exterior access ${spec.id}: length/offset place the access outside the host wall.`);
  }

  const edgeMidpoint = {
    x: start.x + tangentXZ.x * ((uMin + uMax) / 2),
    z: start.z + tangentXZ.z * ((uMin + uMax) / 2),
  };

  const n1 = { x: -tangentXZ.z, z: tangentXZ.x };
  const n2 = { x: tangentXZ.z, z: -tangentXZ.x };
  const outwardXZ = pickOutwardNormalXZ(outer, edgeMidpoint, n1, n2);

  return {
    start,
    tangentXZ,
    outwardXZ,
    uMin,
  };
}

function localToArch(start: Vec2, tangentXZ: Vec2, outwardXZ: Vec2, along: number, up: number, out: number): Vec3 {
  return {
    x: start.x + tangentXZ.x * along + outwardXZ.x * out,
    y: up,
    z: start.z + tangentXZ.z * along + outwardXZ.z * out,
  };
}

function createPart(
  accessId: string,
  idSuffix: string,
  kind: DerivedExteriorAccessPart['kind'],
  start: Vec2,
  tangentXZ: Vec2,
  outwardXZ: Vec2,
  centerAlong: number,
  centerY: number,
  centerOut: number,
  size: DerivedExteriorAccessPart['size']
): DerivedExteriorAccessPart {
  return {
    id: `${accessId}-${idSuffix}`,
    accessId,
    kind,
    centerArch: localToArch(start, tangentXZ, outwardXZ, centerAlong, centerY, centerOut),
    size,
    tangentXZ,
    outwardXZ,
  };
}

type DerivedExteriorAccessesResult = {
  parts: DerivedExteriorAccessPart[];
  cutouts: DerivedExteriorAccessCutout[];
};

export function deriveExteriorAccesses(
  house: ArchitecturalHouse,
  context: DeriveExteriorAccessesContext
): DerivedExteriorAccessesResult {
  void context.walls;

  return (house.exteriorAccesses ?? []).reduce<DerivedExteriorAccessesResult>((result, spec) => {
    const level = house.levels.find((entry) => entry.id === spec.levelId);
    if (!level) {
      throw new Error(`Exterior access ${spec.id}: level ${spec.levelId} was not found.`);
    }

    const { start, tangentXZ, outwardXZ, uMin } = resolveEdgePlacement(level, spec);
    const floorThickness = spec.floorThickness ?? DEFAULT_FLOOR_THICKNESS;
    const wallThickness = spec.wallThickness ?? DEFAULT_WALL_THICKNESS;
    const wallHeight = spec.wallHeight ?? Math.abs(level.elevation);
    const guardWallHeight = spec.guardWallHeight ?? 0;
    const floorTopY = level.elevation;
    const clearWidth = Math.max(spec.wellWidth - wallThickness, 0.6);
    const clearOutCenter = clearWidth / 2;
    const wellLength = spec.landingLength + spec.stairRun;
    const stairRunPerStep = spec.stairRun / spec.stepCount;
    const risePerStep = spec.stairRise / spec.stepCount;

    const parts: DerivedExteriorAccessPart[] = [
      createPart(
        spec.id,
        'floor',
        'floor',
        start,
        tangentXZ,
        outwardXZ,
        uMin + wellLength / 2,
        floorTopY - floorThickness / 2,
        spec.wellWidth / 2,
        {
          x: wellLength,
          y: floorThickness,
          z: spec.wellWidth,
        }
      ),
      createPart(
        spec.id,
        'outer-wall',
        'retaining-wall',
        start,
        tangentXZ,
        outwardXZ,
        uMin + wellLength / 2,
        floorTopY + wallHeight / 2,
        spec.wellWidth - wallThickness / 2,
        {
          x: wellLength,
          y: wallHeight,
          z: wallThickness,
        }
      ),
      createPart(
        spec.id,
        'front-wall',
        'retaining-wall',
        start,
        tangentXZ,
        outwardXZ,
        uMin + wallThickness / 2,
        floorTopY + wallHeight / 2,
        spec.wellWidth / 2,
        {
          x: wallThickness,
          y: wallHeight,
          z: spec.wellWidth,
        }
      ),
    ];

    if (guardWallHeight > 0) {
      const guardWallCenterY = floorTopY + wallHeight + guardWallHeight / 2;
      parts.push(
        createPart(
          spec.id,
          'outer-guard-wall',
          'guard-wall',
          start,
          tangentXZ,
          outwardXZ,
          uMin + wellLength / 2,
          guardWallCenterY,
          spec.wellWidth - wallThickness / 2,
          {
            x: wellLength,
            y: guardWallHeight,
            z: wallThickness,
          }
        ),
        createPart(
          spec.id,
          'front-guard-wall',
          'guard-wall',
          start,
          tangentXZ,
          outwardXZ,
          uMin + wallThickness / 2,
          guardWallCenterY,
          spec.wellWidth / 2,
          {
            x: wallThickness,
            y: guardWallHeight,
            z: spec.wellWidth,
          }
        )
      );
    }

    const cutout: DerivedExteriorAccessCutout = {
      id: `${spec.id}-cutout`,
      accessId: spec.id,
      polygon: [
        localToArch(start, tangentXZ, outwardXZ, uMin, 0, 0),
        localToArch(start, tangentXZ, outwardXZ, uMin + wellLength, 0, 0),
        localToArch(start, tangentXZ, outwardXZ, uMin + wellLength, 0, spec.wellWidth),
        localToArch(start, tangentXZ, outwardXZ, uMin, 0, spec.wellWidth),
      ].map(({ x, z }) => ({ x, z })),
    };

    for (let stepIndex = 0; stepIndex < spec.stepCount; stepIndex += 1) {
      const height = risePerStep * (stepIndex + 1);
      parts.push(
        createPart(
          spec.id,
          `step-${stepIndex + 1}`,
          'stair-step',
          start,
          tangentXZ,
          outwardXZ,
          uMin + spec.landingLength + stairRunPerStep * (stepIndex + 0.5),
          floorTopY + height / 2,
          clearOutCenter,
          {
            x: stairRunPerStep,
            y: height,
            z: clearWidth,
          }
        )
      );
    }

    result.parts.push(...parts);
    result.cutouts.push(cutout);
    return result;
  }, { parts: [], cutouts: [] });
}
