import type { ArchitecturalHouse, Vec2 } from '../architecturalTypes';

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

function isPointOnSegmentXZ(point: Vec2, a: Vec2, b: Vec2): boolean {
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

function isPointInsidePolygonXZ(polygon: Vec2[], point: Vec2): boolean {
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

function roomError(roomId: string, reason: string): Error {
  return new Error(`Room "${roomId}" is invalid: ${reason}`);
}

function canonicalUndirectedEdgeKey(a: Vec2, b: Vec2): string {
  const aKey = `${a.x},${a.z}`;
  const bKey = `${b.x},${b.z}`;
  return aKey <= bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

export function validateRooms(arch: ArchitecturalHouse) {
  if (!arch.rooms || arch.rooms.length === 0) {
    return;
  }

  const levelsById = new Map(arch.levels.map((level) => [level.id, level]));
  const sharedEdgeClaims = new Map<string, { roomId: string; type: 'wall' | 'open' }>();

  for (const room of arch.rooms) {
    const level = levelsById.get(room.levelId);
    if (!level) {
      throw roomError(room.id, `levelId "${room.levelId}" does not exist.`);
    }

    if (room.polygon.length < 3) {
      throw roomError(room.id, `polygon must have at least 3 vertices (got ${room.polygon.length}).`);
    }

    if (room.edges.length !== room.polygon.length) {
      throw roomError(
        room.id,
        `edges length (${room.edges.length}) must match polygon edge count (${room.polygon.length}).`
      );
    }

    const area = Math.abs(polygonSignedAreaXZ(room.polygon));
    if (area <= EPSILON) {
      throw roomError(room.id, 'polygon is degenerate (area is zero).');
    }

    for (let i = 0; i < room.polygon.length; i += 1) {
      const point = room.polygon[i];
      if (!isPointInsidePolygonXZ(level.footprint.outer, point)) {
        throw roomError(
          room.id,
          `polygon vertex ${i} (${point.x}, ${point.z}) lies outside level "${level.id}" footprint.`
        );
      }
    }

    for (let i = 0; i < room.polygon.length; i += 1) {
      const a = room.polygon[i];
      const b = room.polygon[(i + 1) % room.polygon.length];
      const midpoint = { x: (a.x + b.x) * 0.5, z: (a.z + b.z) * 0.5 };
      const edgeType = room.edges[i].type;
      const sharedEdgeKey = `${room.levelId}:${canonicalUndirectedEdgeKey(a, b)}`;
      const existingClaim = sharedEdgeClaims.get(sharedEdgeKey);

      if (!existingClaim) {
        sharedEdgeClaims.set(sharedEdgeKey, { roomId: room.id, type: edgeType });
      } else if (existingClaim.roomId !== room.id && existingClaim.type !== edgeType) {
        throw roomError(
          room.id,
          `shared edge with room "${existingClaim.roomId}" has conflicting edge types (${existingClaim.type} vs ${edgeType}).`
        );
      }

      if (!isPointInsidePolygonXZ(level.footprint.outer, midpoint)) {
        throw roomError(
          room.id,
          `polygon edge ${i} exits level "${level.id}" footprint (midpoint ${midpoint.x}, ${midpoint.z}).`
        );
      }
    }
  }
}
