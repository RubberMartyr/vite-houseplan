import * as polygonClippingNamespace from 'polygon-clipping';
import type { MultiPolygon, Pair, Polygon } from 'polygon-clipping';

const polygonClipping =
  (polygonClippingNamespace as typeof polygonClippingNamespace & { default?: typeof polygonClippingNamespace })
    .default ?? polygonClippingNamespace;
import type { ArchitecturalHouse, LevelSpec, RoomEdgeSpec, RoomSpec, Vec2 } from '../architecturalTypes';

const EPSILON = 1e-6;
const AREA_EPSILON = 1e-5;

type RoomEdge = {
  room: RoomSpec;
  edgeIndex: number;
  type: RoomEdgeSpec['type'];
  a: Vec2;
  b: Vec2;
};

function toRing(points: Vec2[]): Pair[] {
  if (points.length === 0) {
    return [];
  }

  const ring: Pair[] = points.map((point) => [point.x, point.z] as Pair);
  const [firstX, firstZ] = ring[0];
  const [lastX, lastZ] = ring[ring.length - 1];

  if (Math.abs(firstX - lastX) > EPSILON || Math.abs(firstZ - lastZ) > EPSILON) {
    ring.push([firstX, firstZ]);
  }

  return ring;
}

function areaOfRing(points: Vec2[]): number {
  let area2 = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area2 += current.x * next.z - next.x * current.z;
  }

  return area2 / 2;
}

function isPointOnSegment(point: Vec2, a: Vec2, b: Vec2): boolean {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = point.x - a.x;
  const apz = point.z - a.z;
  const cross = abx * apz - abz * apx;

  if (Math.abs(cross) > EPSILON) {
    return false;
  }

  const dot = apx * abx + apz * abz;
  if (dot < -EPSILON) {
    return false;
  }

  const len2 = abx * abx + abz * abz;
  return dot <= len2 + EPSILON;
}

function isPointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];

    if (isPointOnSegment(point, a, b)) {
      return true;
    }

    const intersects =
      (a.z > point.z) !== (b.z > point.z) &&
      point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function cross2(ax: number, az: number, bx: number, bz: number): number {
  return ax * bz - az * bx;
}

function edgeLength(edge: RoomEdge): number {
  const dx = edge.b.x - edge.a.x;
  const dz = edge.b.z - edge.a.z;
  return Math.hypot(dx, dz);
}

function collinearOverlapLength(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): number {
  const adx = a2.x - a1.x;
  const adz = a2.z - a1.z;
  const length = Math.hypot(adx, adz);

  if (length <= EPSILON) {
    return 0;
  }

  const ux = adx / length;
  const uz = adz / length;

  const crossStart = cross2(adx, adz, b1.x - a1.x, b1.z - a1.z);
  const crossEnd = cross2(adx, adz, b2.x - a1.x, b2.z - a1.z);

  if (Math.abs(crossStart) > EPSILON || Math.abs(crossEnd) > EPSILON) {
    return 0;
  }

  const aMin = 0;
  const aMax = length;
  const bProj1 = (b1.x - a1.x) * ux + (b1.z - a1.z) * uz;
  const bProj2 = (b2.x - a1.x) * ux + (b2.z - a1.z) * uz;
  const bMin = Math.min(bProj1, bProj2);
  const bMax = Math.max(bProj1, bProj2);

  const overlapMin = Math.max(aMin, bMin);
  const overlapMax = Math.min(aMax, bMax);

  return Math.max(0, overlapMax - overlapMin);
}

function polygonsArea(multiPolygon: MultiPolygon): number {
  let totalArea = 0;

  for (const polygon of multiPolygon) {
    for (let i = 0; i < polygon.length; i += 1) {
      const ring = polygon[i];
      let ringArea2 = 0;

      for (let j = 0; j < ring.length - 1; j += 1) {
        const [x1, z1] = ring[j];
        const [x2, z2] = ring[j + 1];
        ringArea2 += x1 * z2 - x2 * z1;
      }

      const signedArea = ringArea2 / 2;
      totalArea += i === 0 ? Math.abs(signedArea) : -Math.abs(signedArea);
    }
  }

  return Math.max(0, totalArea);
}

function extractRoomEdges(room: RoomSpec): RoomEdge[] {
  const edges: RoomEdge[] = [];

  for (let i = 0; i < room.polygon.length; i += 1) {
    edges.push({
      room,
      edgeIndex: i,
      type: room.edges[i].type,
      a: room.polygon[i],
      b: room.polygon[(i + 1) % room.polygon.length],
    });
  }

  return edges;
}

function edgeLiesOnFootprintBoundary(edge: RoomEdge, footprint: Vec2[]): boolean {
  for (let i = 0; i < footprint.length; i += 1) {
    const a = footprint[i];
    const b = footprint[(i + 1) % footprint.length];

    if (collinearOverlapLength(edge.a, edge.b, a, b) > EPSILON) {
      return true;
    }
  }

  return false;
}

function validateRoomBasics(level: LevelSpec, rooms: RoomSpec[]): void {
  for (const room of rooms) {
    if (room.polygon.length < 3) {
      throw new Error(`Room "${room.id}" is invalid: polygon must have at least 3 vertices.`);
    }

    if (room.edges.length !== room.polygon.length) {
      throw new Error(
        `Room "${room.id}" is invalid: edges length (${room.edges.length}) must match polygon edge count (${room.polygon.length}).`
      );
    }

    if (Math.abs(areaOfRing(room.polygon)) <= AREA_EPSILON) {
      throw new Error(`Room "${room.id}" is invalid: polygon is degenerate.`);
    }

    for (const vertex of room.polygon) {
      if (!isPointInPolygon(vertex, level.footprint.outer)) {
        throw new Error(`Room ${room.id} extends outside footprint`);
      }
    }
  }
}

function validateRoomOverlaps(rooms: RoomSpec[]): void {
  for (let i = 0; i < rooms.length; i += 1) {
    const roomA = rooms[i];
    const polyA: Polygon = [toRing(roomA.polygon)];

    for (let j = i + 1; j < rooms.length; j += 1) {
      const roomB = rooms[j];
      const polyB: Polygon = [toRing(roomB.polygon)];

      const intersection = polygonClipping.intersection(polyA, polyB);
      const overlapArea = polygonsArea(intersection);

      if (overlapArea > AREA_EPSILON) {
        throw new Error(`Rooms overlap: ${roomA.id} and ${roomB.id}`);
      }
    }
  }
}

function validateFullCoverage(levelId: string, footprint: Vec2[], rooms: RoomSpec[]): void {
  const roomPolygons = rooms.map((room) => [toRing(room.polygon)] as Polygon);
  const [firstPolygon, ...restPolygons] = roomPolygons;

  if (!firstPolygon) {
    throw new Error(`Rooms do not fully cover footprint on level ${levelId}`);
  }

  const union = polygonClipping.union(firstPolygon, ...restPolygons);
  const footprintPoly: Polygon = [toRing(footprint)];

  const missing = polygonClipping.difference(footprintPoly, union);
  const missingArea = polygonsArea(missing);

  if (missingArea > AREA_EPSILON) {
    throw new Error(`Rooms do not fully cover footprint on level ${levelId}`);
  }
}

function validateExteriorWallConflicts(level: LevelSpec, rooms: RoomSpec[]): void {
  const allEdges = rooms.flatMap(extractRoomEdges);

  for (const edge of allEdges) {
    if (!edgeLiesOnFootprintBoundary(edge, level.footprint.outer)) {
      continue;
    }

    for (const other of allEdges) {
      if (other.room.id === edge.room.id) {
        continue;
      }

      if (other.type !== 'wall') {
        continue;
      }

      const overlap = collinearOverlapLength(edge.a, edge.b, other.a, other.b);
      if (overlap > EPSILON) {
        throw new Error(`Interior wall overlaps exterior wall near room ${other.room.id}`);
      }
    }
  }
}

function validateSharedEdgeAgreement(rooms: RoomSpec[]): void {
  const allEdges = rooms.flatMap(extractRoomEdges);

  for (let i = 0; i < allEdges.length; i += 1) {
    const edgeA = allEdges[i];

    for (let j = i + 1; j < allEdges.length; j += 1) {
      const edgeB = allEdges[j];

      if (edgeA.room.id === edgeB.room.id) {
        continue;
      }

      const overlap = collinearOverlapLength(edgeA.a, edgeA.b, edgeB.a, edgeB.b);
      if (overlap <= EPSILON) {
        continue;
      }

      const minOverlap = Math.min(edgeLength(edgeA), edgeLength(edgeB));
      if (overlap < minOverlap - EPSILON) {
        continue;
      }

      if (edgeA.type !== edgeB.type) {
        throw new Error(`Edge mismatch between ${edgeA.room.id} and ${edgeB.room.id}`);
      }
    }
  }
}

export function validateFloorplan(architecturalHouse: ArchitecturalHouse): void {
  if (!architecturalHouse.rooms || architecturalHouse.rooms.length === 0) {
    throw new Error('rooms must exist');
  }

  const levelsById = new Map(architecturalHouse.levels.map((level) => [level.id, level]));
  const roomsByLevel = new Map<string, RoomSpec[]>();

  for (const room of architecturalHouse.rooms) {
    const level = levelsById.get(room.levelId);

    if (!level) {
      throw new Error(`Room "${room.id}" is invalid: levelId "${room.levelId}" does not exist.`);
    }

    const existing = roomsByLevel.get(room.levelId);
    if (existing) {
      existing.push(room);
    } else {
      roomsByLevel.set(room.levelId, [room]);
    }
  }

  for (const [levelId, rooms] of roomsByLevel) {
    const level = levelsById.get(levelId);

    if (!level) {
      continue;
    }

    validateRoomBasics(level, rooms);
    validateRoomOverlaps(rooms);
    validateFullCoverage(level.id, level.footprint.outer, rooms);
    validateExteriorWallConflicts(level, rooms);
    validateSharedEdgeAgreement(rooms);
  }
}
