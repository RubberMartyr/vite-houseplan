import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';

type Vec2XZ = { x: number; z: number };

const EPSILON = 1e-9;
const INWARD_PROBE_DISTANCE = 0.05;

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

function isPointInsidePolygonXZ(polygon: Vec2[], point: Vec2XZ): boolean {
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

export type WallDirectionVectors = {
  length: number;
  tangent: Vec2XZ;
  outward: Vec2XZ;
  inward: Vec2XZ;
};

export function resolveWallExtrusionDirection(
  wall: DerivedWallSegment,
  footprintOuter?: Vec2[]
): WallDirectionVectors | null {
  const wallDx = wall.end.x - wall.start.x;
  const wallDz = wall.end.z - wall.start.z;
  const length = Math.hypot(wallDx, wallDz);

  if (length <= EPSILON) {
    return null;
  }

  const tangent = { x: wallDx / length, z: wallDz / length };
  let outward = {
    x: -tangent.z * wall.outwardSign,
    z: tangent.x * wall.outwardSign,
  };

  if (footprintOuter && footprintOuter.length >= 3) {
    const midpoint = {
      x: (wall.start.x + wall.end.x) * 0.5,
      z: (wall.start.z + wall.end.z) * 0.5,
    };
    const testPoint = {
      x: midpoint.x - outward.x * INWARD_PROBE_DISTANCE,
      z: midpoint.z - outward.z * INWARD_PROBE_DISTANCE,
    };

    if (!isPointInsidePolygonXZ(footprintOuter, testPoint)) {
      outward = { x: -outward.x, z: -outward.z };
    }
  }

  return {
    length,
    tangent,
    outward,
    inward: { x: -outward.x, z: -outward.z },
  };
}
