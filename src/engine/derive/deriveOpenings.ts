import type { ArchitecturalHouse, Vec2 } from '../architecturalTypes';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';

type Vec2XZ = { x: number; z: number };

const OUTWARD_PROBE_DISTANCE = 0.05;
const EPSILON = 1e-9;

function polygonSignedAreaXZ(points: Vec2[]): number {
  let area2 = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area2 += current.x * next.z - next.x * current.z;
  }

  return area2 / 2;
}

function isPointOnSegmentXZ(point: Vec2XZ, a: Vec2XZ, b: Vec2XZ): boolean {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = point.x - a.x;
  const apz = point.z - a.z;
  const cross = abx * apz - abz * apx;

  if (Math.abs(cross) > EPSILON) return false;

  const dot = apx * abx + apz * abz;
  if (dot < -EPSILON) return false;

  const len2 = abx * abx + abz * abz;
  return dot <= len2 + EPSILON;
}

export function isPointInsidePolygonXZ(polygon: Vec2[], point: Vec2XZ): boolean {
  if (polygon.length < 3) return false;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];

    if (isPointOnSegmentXZ(point, a, b)) {
      return true;
    }

    const intersects =
      (a.z > point.z) !== (b.z > point.z) &&
      point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pickOutwardNormalXZ(
  outer: Vec2[],
  edgeMidpoint: Vec2XZ,
  n1: Vec2XZ,
  n2: Vec2XZ
): Vec2XZ {
  const ccw = polygonSignedAreaXZ(outer) > 0;
  const preferred = ccw ? n2 : n1;
  const fallback = ccw ? n1 : n2;

  const pPreferred = {
    x: edgeMidpoint.x + preferred.x * OUTWARD_PROBE_DISTANCE,
    z: edgeMidpoint.z + preferred.z * OUTWARD_PROBE_DISTANCE,
  };

  if (!isPointInsidePolygonXZ(outer, pPreferred)) {
    return preferred;
  }

  const pFallback = {
    x: edgeMidpoint.x + fallback.x * OUTWARD_PROBE_DISTANCE,
    z: edgeMidpoint.z + fallback.z * OUTWARD_PROBE_DISTANCE,
  };

  if (!isPointInsidePolygonXZ(outer, pFallback)) {
    return fallback;
  }

  return preferred;
}

export function deriveOpenings(house: ArchitecturalHouse): DerivedOpeningRect[] {
  const levelIndexById = new Map(house.levels.map((level, index) => [level.id, index]));
  const out: DerivedOpeningRect[] = [];

  for (const opening of house.openings ?? []) {
    const levelIndex = levelIndexById.get(opening.levelId);
    if (levelIndex == null) continue;

    const level = house.levels[levelIndex];
    const outer = level.footprint.outer;
    const edgeIndex = opening.edge.edgeIndex;

    if (!outer.length) continue;

    const a = outer[edgeIndex];
    const b = outer[(edgeIndex + 1) % outer.length];

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const edgeLength = Math.hypot(dx, dz);
    if (edgeLength <= EPSILON) continue;

    const tx = dx / edgeLength;
    const tz = dz / edgeLength;

    const u0 = opening.edge.fromEnd ? edgeLength - (opening.offset + opening.width) : opening.offset;
    const u1 = u0 + opening.width;

    const uMin = u0;
    const uMax = u1;

    const vMin = opening.sillHeight;
    const vMax = opening.sillHeight + opening.height;

    const edgeMidU = (uMin + uMax) / 2;
    const edgeMid = {
      x: a.x + tx * edgeMidU,
      z: a.z + tz * edgeMidU,
    };

    const n1 = { x: -tz, z: tx };
    const n2 = { x: tz, z: -tx };
    const outward = pickOutwardNormalXZ(outer, edgeMid, n1, n2);

    out.push({
      id: opening.id,
      kind: opening.kind,
      levelIndex,
      edgeIndex,
      uMin,
      uMax,
      vMin,
      vMax,
      centerArch: {
        x: edgeMid.x,
        y: level.elevation + (vMin + vMax) / 2,
        z: edgeMid.z,
      },
      tangentXZ: { x: tx, z: tz },
      outwardXZ: outward,
      style: opening.style,
    });
  }

  return out;
}
