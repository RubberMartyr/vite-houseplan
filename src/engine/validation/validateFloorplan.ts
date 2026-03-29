import * as polygonClippingNamespace from 'polygon-clipping';
import type { MultiPolygon, Pair, Polygon } from 'polygon-clipping';
import type { ArchitecturalHouse, LevelSpec, RoomEdgeSpec, RoomSpec, Vec2 } from '../architecturalTypes';

const polygonClipping =
  (polygonClippingNamespace as typeof polygonClippingNamespace & { default?: typeof polygonClippingNamespace })
    .default ?? polygonClippingNamespace;

export const VALIDATION_TOLERANCES = {
  coordinateEpsilon: 0.02,
  edgeOverlapMin: 0.1,
  tinyGapArea: 0.25,
  majorGapArea: 1.0,
  tJunctionSnapDistance: 0.1,
  cornerTouchDistance: 0.05,
} as const;

const EPSILON = VALIDATION_TOLERANCES.coordinateEpsilon;
const AREA_EPSILON = 1e-5;
const THIN_WIDTH_WARNING = 0.45;
const THIN_WIDTH_ERROR = 0.2;
const GAP_WARNING_AREA = VALIDATION_TOLERANCES.tinyGapArea;
const GAP_ERROR_AREA = VALIDATION_TOLERANCES.majorGapArea;
const EDGE_MISMATCH_LENGTH_THRESHOLD = 1.0;
const EDGE_MISMATCH_RATIO_THRESHOLD = 0.5;
const PARTIAL_SHARED_EDGE_ERROR_RATIO = 0.8;
const TOPOLOGY_MIN_SHARED_OVERLAP = VALIDATION_TOLERANCES.edgeOverlapMin;
const TINY_RESIDUAL_EDGE_LENGTH = 0.05;

type Segment = {
  a: Vec2;
  b: Vec2;
};

type RoomEdge = Segment & {
  room: RoomSpec;
  edgeIndex: number;
  type: RoomEdgeSpec['type'];
};

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationIssue = {
  code:
    | 'ROOM_OVERLAP'
    | 'ROOM_OUTSIDE_FOOTPRINT'
    | 'ROOM_GAP_IN_FOOTPRINT'
    | 'ROOM_INVALID_POLYGON'
    | 'ROOM_EDGE_COUNT_MISMATCH'
    | 'ROOM_EDGE_MISMATCH'
    | 'INTERIOR_WALL_ON_EXTERIOR_BOUNDARY'
    | 'ROOM_PARTIAL_SHARED_EDGE'
    | 'ROOM_ZERO_AREA'
    | 'ROOM_DUPLICATE_VERTEX'
    | 'ROOM_UNCLOSED_TOPOLOGY'
    | 'ROOM_T_JUNCTION'
    | 'ROOM_UNSUPPORTED_HOLE'
    | 'ROOM_TOO_THIN'
    | 'ROOM_SELF_INTERSECTION'
    | 'ROOM_MISSING_LEVEL'
    | 'ROOM_EMPTY_SET'
    | 'ROOM_CORNER_TOUCH'
    | 'ROOM_FRAGMENT_EDGE'
    | 'ROOM_MICRO_GAP'
    | 'ROOM_MICRO_OVERLAP';
  severity: ValidationSeverity;
  message: string;
  levelId?: string;
  roomIds?: string[];
  edge?: {
    a: { x: number; z: number };
    b: { x: number; z: number };
  };
  polygon?: { x: number; z: number }[];
  meta?: Record<string, unknown>;
};

export type AdjacencyRelationshipType =
  | 'exact_shared'
  | 'partial_shared'
  | 't_junction'
  | 'corner_touch'
  | 'exterior_boundary'
  | 'open_transition';

export type RoomAdjacencyEdge = {
  roomAId: string;
  roomBId: string;
  sharedLength: number;
  relationshipType: AdjacencyRelationshipType;
  overlapRatio: number;
  hasTypeMismatch: boolean;
  hasTJunction: boolean;
};

export type FloorplanValidationResult = {
  ok: boolean;
  roomCount: number;
  levelCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
  perLevel: Record<
    string,
    {
      roomCount: number;
      issues: ValidationIssue[];
      uncoveredPolygons?: { x: number; z: number }[][];
      coveredPolygons?: { x: number; z: number }[][];
      overlapPairs?: { roomA: string; roomB: string }[];
      adjacencyEdges?: RoomAdjacencyEdge[];
    }
  >;
};

function polygonRing(points: Vec2[]): Pair[] {
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

function toPolygon(points: Vec2[]): Polygon {
  return [polygonRing(points)];
}

function polygonSignedArea(points: Vec2[]): number {
  let area2 = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area2 += current.x * next.z - next.x * current.z;
  }

  return area2 / 2;
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

function cross2(ax: number, az: number, bx: number, bz: number): number {
  return ax * bz - az * bx;
}

function dot2(ax: number, az: number, bx: number, bz: number): number {
  return ax * bx + az * bz;
}

function pointKey(point: Vec2): string {
  return `${point.x.toFixed(6)},${point.z.toFixed(6)}`;
}

function edgeLength(edge: Segment): number {
  return Math.hypot(edge.b.x - edge.a.x, edge.b.z - edge.a.z);
}

function pointsNearlyEqual(a: Vec2, b: Vec2): boolean {
  return Math.abs(a.x - b.x) <= EPSILON && Math.abs(a.z - b.z) <= EPSILON;
}

function isPointOnSegment(point: Vec2, segment: Segment, eps: number = EPSILON): boolean {
  const abx = segment.b.x - segment.a.x;
  const abz = segment.b.z - segment.a.z;
  const apx = point.x - segment.a.x;
  const apz = point.z - segment.a.z;
  const cross = cross2(abx, abz, apx, apz);

  if (Math.abs(cross) > eps) {
    return false;
  }

  const dot = dot2(apx, apz, abx, abz);
  if (dot < -eps) {
    return false;
  }

  const len2 = abx * abx + abz * abz;
  return dot <= len2 + eps;
}

function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const prev = polygon[j];

    if (isPointOnSegment(point, { a: prev, b: current })) {
      return true;
    }

    const intersects =
      (current.z > point.z) !== (prev.z > point.z) &&
      point.x < ((prev.x - current.x) * (point.z - current.z)) / (prev.z - current.z) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function orientation(a: Vec2, b: Vec2, c: Vec2): number {
  const v = cross2(b.x - a.x, b.z - a.z, c.x - b.x, c.z - b.z);
  if (Math.abs(v) <= EPSILON) return 0;
  return v > 0 ? 1 : -1;
}

function segmentsProperlyIntersect(s1: Segment, s2: Segment): boolean {
  const o1 = orientation(s1.a, s1.b, s2.a);
  const o2 = orientation(s1.a, s1.b, s2.b);
  const o3 = orientation(s2.a, s2.b, s1.a);
  const o4 = orientation(s2.a, s2.b, s1.b);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  return false;
}

function collinearOverlapLength(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2, eps: number = EPSILON): number {
  const adx = a2.x - a1.x;
  const adz = a2.z - a1.z;
  const length = Math.hypot(adx, adz);

  if (length <= eps) {
    return 0;
  }

  const crossStart = cross2(adx, adz, b1.x - a1.x, b1.z - a1.z);
  const crossEnd = cross2(adx, adz, b2.x - a1.x, b2.z - a1.z);

  if (Math.abs(crossStart) > eps || Math.abs(crossEnd) > eps) {
    return 0;
  }

  const ux = adx / length;
  const uz = adz / length;

  const aMin = 0;
  const aMax = length;
  const bProj1 = dot2(b1.x - a1.x, b1.z - a1.z, ux, uz);
  const bProj2 = dot2(b2.x - a1.x, b2.z - a1.z, ux, uz);
  const bMin = Math.min(bProj1, bProj2);
  const bMax = Math.max(bProj1, bProj2);

  return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
}

function edgeOverlapLength(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): number {
  return collinearOverlapLength(edgeA.a, edgeA.b, edgeB.a, edgeB.b, eps);
}

function overlapRatio(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): number {
  const overlapLength = edgeOverlapLength(edgeA, edgeB, eps);
  const shorterLength = Math.min(edgeLength(edgeA), edgeLength(edgeB));
  if (shorterLength <= eps) {
    return 0;
  }
  return overlapLength / shorterLength;
}

function isPointOnSegmentInterior(point: Vec2, edge: Segment, eps: number = EPSILON): boolean {
  return isPointOnSegment(point, edge, eps) && !pointsNearlyEqual(point, edge.a) && !pointsNearlyEqual(point, edge.b);
}

type EdgeRelationship = 'exact_shared' | 'partial_shared' | 't_junction' | 'corner_touch' | 'disjoint';

function classifyEdgeRelationship(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): EdgeRelationship {
  const overlap = edgeOverlapLength(edgeA, edgeB, eps);
  if (overlap > eps) {
    const minLen = Math.min(edgeLength(edgeA), edgeLength(edgeB));
    return overlap >= minLen - eps ? 'exact_shared' : 'partial_shared';
  }

  const hasTJunction =
    isPointOnSegmentInterior(edgeA.a, edgeB, VALIDATION_TOLERANCES.tJunctionSnapDistance) ||
    isPointOnSegmentInterior(edgeA.b, edgeB, VALIDATION_TOLERANCES.tJunctionSnapDistance) ||
    isPointOnSegmentInterior(edgeB.a, edgeA, VALIDATION_TOLERANCES.tJunctionSnapDistance) ||
    isPointOnSegmentInterior(edgeB.b, edgeA, VALIDATION_TOLERANCES.tJunctionSnapDistance);
  if (hasTJunction) {
    return 't_junction';
  }

  const touchesAtEndpoint =
    Math.hypot(edgeA.a.x - edgeB.a.x, edgeA.a.z - edgeB.a.z) <= VALIDATION_TOLERANCES.cornerTouchDistance ||
    Math.hypot(edgeA.a.x - edgeB.b.x, edgeA.a.z - edgeB.b.z) <= VALIDATION_TOLERANCES.cornerTouchDistance ||
    Math.hypot(edgeA.b.x - edgeB.a.x, edgeA.b.z - edgeB.a.z) <= VALIDATION_TOLERANCES.cornerTouchDistance ||
    Math.hypot(edgeA.b.x - edgeB.b.x, edgeA.b.z - edgeB.b.z) <= VALIDATION_TOLERANCES.cornerTouchDistance;
  if (touchesAtEndpoint) {
    return 'corner_touch';
  }

  return 'disjoint';
}

function ringFromPairArray(ring: Pair[]): Vec2[] {
  if (ring.length <= 1) {
    return [];
  }

  const points = ring.slice(0, ring.length - 1).map(([x, z]) => ({ x, z }));
  return points;
}

function flattenOuterRings(multiPolygon: MultiPolygon): Vec2[][] {
  const polygons: Vec2[][] = [];
  for (const polygon of multiPolygon) {
    if (!polygon[0]) continue;
    polygons.push(ringFromPairArray(polygon[0]));
  }
  return polygons;
}

function extractRoomEdges(room: RoomSpec): RoomEdge[] {
  return room.polygon.map((point, edgeIndex) => ({
    room,
    edgeIndex,
    type: room.edges[edgeIndex]?.type ?? 'wall',
    a: point,
    b: room.polygon[(edgeIndex + 1) % room.polygon.length],
  }));
}

function minDistancePointToSegment(point: Vec2, edge: Segment): number {
  const abx = edge.b.x - edge.a.x;
  const abz = edge.b.z - edge.a.z;
  const apx = point.x - edge.a.x;
  const apz = point.z - edge.a.z;
  const len2 = abx * abx + abz * abz;

  if (len2 <= EPSILON) {
    return Math.hypot(apx, apz);
  }

  const t = Math.max(0, Math.min(1, dot2(apx, apz, abx, abz) / len2));
  const cx = edge.a.x + abx * t;
  const cz = edge.a.z + abz * t;
  return Math.hypot(point.x - cx, point.z - cz);
}

function estimateMinimumWidth(points: Vec2[]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    const vertex = points[i];
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];

    for (let j = 0; j < points.length; j += 1) {
      const edge = { a: points[j], b: points[(j + 1) % points.length] };
      if (
        pointsNearlyEqual(edge.a, vertex) ||
        pointsNearlyEqual(edge.b, vertex) ||
        pointsNearlyEqual(edge.a, prev) ||
        pointsNearlyEqual(edge.b, prev) ||
        pointsNearlyEqual(edge.a, next) ||
        pointsNearlyEqual(edge.b, next)
      ) {
        continue;
      }

      const distance = minDistancePointToSegment(vertex, edge);
      minimum = Math.min(minimum, distance);
    }
  }

  return Number.isFinite(minimum) ? minimum : 0;
}

function pushIssue(
  result: FloorplanValidationResult,
  issue: ValidationIssue
): void {
  result.issues.push(issue);
  if (issue.severity === 'error') {
    result.errorCount += 1;
  } else if (issue.severity === 'warning') {
    result.warningCount += 1;
  } else {
    result.infoCount += 1;
  }

  if (issue.levelId) {
    result.perLevel[issue.levelId]?.issues.push(issue);
  }
}

function createInitialResult(arch: ArchitecturalHouse): FloorplanValidationResult {
  return {
    ok: true,
    roomCount: arch.rooms?.length ?? 0,
    levelCount: arch.levels.length,
    issueCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    issues: [],
    perLevel: Object.fromEntries(
      arch.levels.map((level) => [
        level.id,
        {
          roomCount: 0,
          issues: [],
          uncoveredPolygons: [],
          coveredPolygons: [],
          overlapPairs: [],
          adjacencyEdges: [],
        },
      ])
    ),
  };
}

function roomDrivenModeEnabled(arch: ArchitecturalHouse): boolean {
  return Boolean(arch.rooms && arch.rooms.length > 0);
}

function validateRoomPolygon(room: RoomSpec, levelId: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (room.polygon.length < 3) {
    issues.push({
      code: 'ROOM_INVALID_POLYGON',
      severity: 'error',
      message: `Room "${room.id}" polygon must have at least 3 vertices.`,
      levelId,
      roomIds: [room.id],
      polygon: room.polygon,
    });
    return issues;
  }

  const uniqueVertexCount = new Set(room.polygon.map(pointKey)).size;
  if (uniqueVertexCount < 3) {
    issues.push({
      code: 'ROOM_INVALID_POLYGON',
      severity: 'error',
      message: `Room "${room.id}" polygon must have at least 3 unique vertices.`,
      levelId,
      roomIds: [room.id],
      polygon: room.polygon,
    });
  }

  for (let i = 0; i < room.polygon.length; i += 1) {
    const current = room.polygon[i];
    const next = room.polygon[(i + 1) % room.polygon.length];
    if (pointsNearlyEqual(current, next)) {
      issues.push({
        code: 'ROOM_DUPLICATE_VERTEX',
        severity: 'error',
        message: `Room "${room.id}" has duplicate consecutive vertices at edge ${i}.`,
        levelId,
        roomIds: [room.id],
        edge: { a: current, b: next },
      });
    }
  }

  const area = Math.abs(polygonSignedArea(room.polygon));
  if (area <= AREA_EPSILON) {
    issues.push({
      code: 'ROOM_ZERO_AREA',
      severity: 'error',
      message: `Room "${room.id}" has near-zero area (${area.toFixed(6)}).`,
      levelId,
      roomIds: [room.id],
      polygon: room.polygon,
      meta: { area },
    });
  }

  for (let i = 0; i < room.polygon.length; i += 1) {
    const edgeA = { a: room.polygon[i], b: room.polygon[(i + 1) % room.polygon.length] };

    for (let j = i + 1; j < room.polygon.length; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === room.polygon.length - 1)) {
        continue;
      }

      const edgeB = { a: room.polygon[j], b: room.polygon[(j + 1) % room.polygon.length] };
      if (segmentsProperlyIntersect(edgeA, edgeB)) {
        issues.push({
          code: 'ROOM_SELF_INTERSECTION',
          severity: 'error',
          message: `Room "${room.id}" has self-intersecting edges (${i} and ${j}).`,
          levelId,
          roomIds: [room.id],
          edge: { a: edgeA.a, b: edgeA.b },
        });
      }
    }
  }

  const minimumWidth = estimateMinimumWidth(room.polygon);
  if (minimumWidth > 0 && minimumWidth < THIN_WIDTH_WARNING) {
    const severity: ValidationSeverity = minimumWidth < THIN_WIDTH_ERROR ? 'error' : 'warning';
    issues.push({
      code: 'ROOM_TOO_THIN',
      severity,
      message: `Room "${room.id}" is thin (min width ${minimumWidth.toFixed(3)}m).`,
      levelId,
      roomIds: [room.id],
      polygon: room.polygon,
      meta: { minimumWidth, thresholdWarning: THIN_WIDTH_WARNING, thresholdError: THIN_WIDTH_ERROR },
    });
  }

  return issues;
}

function isEdgeOnFootprintBoundary(edge: Segment, footprintOuter: Vec2[], eps: number = EPSILON): boolean {
  const edgeLen = edgeLength(edge);
  if (edgeLen <= eps) {
    return false;
  }

  for (let i = 0; i < footprintOuter.length; i += 1) {
    const boundary: Segment = {
      a: footprintOuter[i],
      b: footprintOuter[(i + 1) % footprintOuter.length],
    };

    const overlap = edgeOverlapLength(edge, boundary, eps);
    if (overlap >= edgeLen - eps) {
      return true;
    }
  }

  return false;
}

function isTinyResidualEdge(edge: Segment, eps: number = EPSILON): boolean {
  return edgeLength(edge) <= Math.max(TINY_RESIDUAL_EDGE_LENGTH, eps * 10);
}

function roomPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function endpointMisalignmentDistance(edgeA: Segment, edgeB: Segment): number {
  return Math.min(
    Math.hypot(edgeA.a.x - edgeB.a.x, edgeA.a.z - edgeB.a.z),
    Math.hypot(edgeA.a.x - edgeB.b.x, edgeA.a.z - edgeB.b.z),
    Math.hypot(edgeA.b.x - edgeB.a.x, edgeA.b.z - edgeB.a.z),
    Math.hypot(edgeA.b.x - edgeB.b.x, edgeA.b.z - edgeB.b.z)
  );
}

function upsertAdjacencyEdge(
  map: Map<string, RoomAdjacencyEdge>,
  edge: RoomAdjacencyEdge
): void {
  const key = `${roomPairKey(edge.roomAId, edge.roomBId)}|${edge.relationshipType}`;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, edge);
    return;
  }

  existing.sharedLength = Math.max(existing.sharedLength, edge.sharedLength);
  existing.overlapRatio = Math.max(existing.overlapRatio, edge.overlapRatio);
  existing.hasTypeMismatch = existing.hasTypeMismatch || edge.hasTypeMismatch;
  existing.hasTJunction = existing.hasTJunction || edge.hasTJunction;
}

function validateRoomInsideFootprint(room: RoomSpec, level: LevelSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const vertex of room.polygon) {
    if (!pointInPolygon(vertex, level.footprint.outer)) {
      issues.push({
        code: 'ROOM_OUTSIDE_FOOTPRINT',
        severity: 'error',
        message: `Room "${room.id}" has vertices outside level footprint.`,
        levelId: level.id,
        roomIds: [room.id],
        polygon: room.polygon,
      });
      break;
    }
  }

  const outside = polygonClipping.difference(toPolygon(room.polygon), toPolygon(level.footprint.outer));
  const outsideArea = polygonsArea(outside);
  if (outsideArea > AREA_EPSILON) {
    issues.push({
      code: 'ROOM_OUTSIDE_FOOTPRINT',
      severity: 'error',
      message: `Room "${room.id}" extends outside level "${level.id}" footprint (outside area ${outsideArea.toFixed(4)}).`,
      levelId: level.id,
      roomIds: [room.id],
      polygon: room.polygon,
      meta: { outsideArea },
    });
  }

  return issues;
}

export function validateFloorplan(arch: ArchitecturalHouse): FloorplanValidationResult {
  const result = createInitialResult(arch);

  const rooms = arch.rooms ?? [];
  if (rooms.length === 0) {
    pushIssue(result, {
      code: 'ROOM_EMPTY_SET',
      severity: roomDrivenModeEnabled(arch) ? 'error' : 'warning',
      message: 'No rooms defined.',
    });
  }

  const levelById = new Map(arch.levels.map((level) => [level.id, level]));
  const roomsByLevel = new Map<string, RoomSpec[]>();
  const warnedHoleLevels = new Set<string>();

  for (const room of rooms) {
    const level = levelById.get(room.levelId);
    if (!level) {
      pushIssue(result, {
        code: 'ROOM_MISSING_LEVEL',
        severity: 'error',
        message: `Room "${room.id}" references missing levelId "${room.levelId}".`,
        roomIds: [room.id],
        meta: { levelId: room.levelId },
      });
      continue;
    }

    const levelRooms = roomsByLevel.get(level.id) ?? [];
    levelRooms.push(room);
    roomsByLevel.set(level.id, levelRooms);
    result.perLevel[level.id].roomCount = levelRooms.length;

    if ((level.footprint.holes?.length ?? 0) > 0 && !warnedHoleLevels.has(level.id)) {
      warnedHoleLevels.add(level.id);
      pushIssue(result, {
        code: 'ROOM_UNSUPPORTED_HOLE',
        severity: 'warning',
        message: `Level "${level.id}" footprint defines holes, which room validation does not model yet.`,
        levelId: level.id,
      });
    }

    if (room.edges.length !== room.polygon.length) {
      pushIssue(result, {
        code: 'ROOM_EDGE_COUNT_MISMATCH',
        severity: 'error',
        message: `Room "${room.id}" edges count (${room.edges.length}) does not match polygon edge count (${room.polygon.length}).`,
        levelId: level.id,
        roomIds: [room.id],
      });
    }

    for (const issue of validateRoomPolygon(room, level.id)) {
      pushIssue(result, issue);
    }

    for (const issue of validateRoomInsideFootprint(room, level)) {
      pushIssue(result, issue);
    }

    for (const edge of extractRoomEdges(room)) {
      if (isEdgeOnFootprintBoundary(edge, level.footprint.outer) && edge.type === 'wall') {
        pushIssue(result, {
          code: 'INTERIOR_WALL_ON_EXTERIOR_BOUNDARY',
          severity: 'error',
          message: `Room "${room.id}" edge ${edge.edgeIndex} is marked as interior wall while lying on exterior footprint boundary.`,
          levelId: level.id,
          roomIds: [room.id],
          edge: { a: edge.a, b: edge.b },
        });
      }
    }
  }

  for (const level of arch.levels) {
    const levelRooms = roomsByLevel.get(level.id) ?? [];
    const levelEdges = levelRooms.flatMap(extractRoomEdges);
    const adjacencyEdges = new Map<string, RoomAdjacencyEdge>();
    const groupedTJunctions = new Map<string, { roomAId: string; roomBId: string; edgeA: RoomEdge; edgeB: RoomEdge; count: number }>();
    const groupedPartialShares = new Map<string, { roomAId: string; roomBId: string; edge: RoomEdge; count: number; maxOverlap: number; maxRatio: number; maxMisalignment: number }>();

    for (let i = 0; i < levelRooms.length; i += 1) {
      const roomA = levelRooms[i];
      const polyA = toPolygon(roomA.polygon);

      for (let j = i + 1; j < levelRooms.length; j += 1) {
        const roomB = levelRooms[j];
        const polyB = toPolygon(roomB.polygon);

        const overlap = polygonClipping.intersection(polyA, polyB);
        const overlapArea = polygonsArea(overlap);
        if (overlapArea > AREA_EPSILON) {
          pushIssue(result, {
            code: 'ROOM_OVERLAP',
            severity: 'error',
            message: `Rooms "${roomA.id}" and "${roomB.id}" overlap by area ${overlapArea.toFixed(4)}.`,
            levelId: level.id,
            roomIds: [roomA.id, roomB.id],
            meta: { overlapArea, overlapPolygons: flattenOuterRings(overlap) },
          });
          if (overlapArea < VALIDATION_TOLERANCES.tinyGapArea) {
            pushIssue(result, {
              code: 'ROOM_MICRO_OVERLAP',
              severity: 'warning',
              message: `Rooms "${roomA.id}" and "${roomB.id}" have a micro-overlap (${overlapArea.toFixed(4)}m²).`,
              levelId: level.id,
              roomIds: [roomA.id, roomB.id],
              meta: { overlapArea, groupedBy: 'roomPair' },
            });
          }
          result.perLevel[level.id].overlapPairs?.push({ roomA: roomA.id, roomB: roomB.id });
        }
      }
    }

    for (let i = 0; i < levelEdges.length; i += 1) {
      const edgeA = levelEdges[i];

      for (let j = i + 1; j < levelEdges.length; j += 1) {
        const edgeB = levelEdges[j];

        if (edgeA.room.id === edgeB.room.id) {
          continue;
        }

        const relationship = classifyEdgeRelationship(edgeA, edgeB);
        if (relationship === 't_junction') {
          const tKey = roomPairKey(edgeA.room.id, edgeB.room.id);
          const existing = groupedTJunctions.get(tKey);
          if (!existing) {
            groupedTJunctions.set(tKey, {
              roomAId: edgeA.room.id,
              roomBId: edgeB.room.id,
              edgeA,
              edgeB,
              count: 1,
            });
          } else {
            existing.count += 1;
          }
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: 0,
            relationshipType: 't_junction',
            overlapRatio: 0,
            hasTypeMismatch: false,
            hasTJunction: true,
          });
          continue;
        }

        if (relationship === 'corner_touch') {
          pushIssue(result, {
            code: 'ROOM_CORNER_TOUCH',
            severity: 'info',
            message: `Rooms "${edgeA.room.id}" and "${edgeB.room.id}" touch at a corner.`,
            levelId: level.id,
            roomIds: [edgeA.room.id, edgeB.room.id],
            edge: { a: edgeA.a, b: edgeA.b },
            meta: { edgeAIndex: edgeA.edgeIndex, edgeBIndex: edgeB.edgeIndex },
          });
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: 0,
            relationshipType: 'corner_touch',
            overlapRatio: 0,
            hasTypeMismatch: false,
            hasTJunction: false,
          });
          continue;
        }

        if (relationship === 'disjoint') {
          continue;
        }

        const overlap = edgeOverlapLength(edgeA, edgeB);
        const sharedRatio = overlapRatio(edgeA, edgeB);
        const minLen = Math.min(edgeLength(edgeA), edgeLength(edgeB));
        const isFullSharedEdge = overlap >= minLen - EPSILON;

        if (!isFullSharedEdge) {
          const misalignmentDistance = endpointMisalignmentDistance(edgeA, edgeB);
          const pairKey = roomPairKey(edgeA.room.id, edgeB.room.id);
          const existing = groupedPartialShares.get(pairKey);
          if (!existing) {
            groupedPartialShares.set(pairKey, {
              roomAId: edgeA.room.id,
              roomBId: edgeB.room.id,
              edge: edgeA,
              count: 1,
              maxOverlap: overlap,
              maxRatio: sharedRatio,
              maxMisalignment: misalignmentDistance,
            });
          } else {
            existing.count += 1;
            existing.maxOverlap = Math.max(existing.maxOverlap, overlap);
            existing.maxRatio = Math.max(existing.maxRatio, sharedRatio);
            existing.maxMisalignment = Math.max(existing.maxMisalignment, misalignmentDistance);
          }
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: overlap,
            relationshipType: 'partial_shared',
            overlapRatio: sharedRatio,
            hasTypeMismatch: edgeA.type !== edgeB.type,
            hasTJunction: false,
          });
        } else {
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: overlap,
            relationshipType: edgeA.type === 'open' || edgeB.type === 'open' ? 'open_transition' : 'exact_shared',
            overlapRatio: sharedRatio,
            hasTypeMismatch: edgeA.type !== edgeB.type,
            hasTJunction: false,
          });
        }

        if (edgeA.type !== edgeB.type) {
          const meaningfulOverlap =
            overlap > EDGE_MISMATCH_LENGTH_THRESHOLD &&
            sharedRatio > EDGE_MISMATCH_RATIO_THRESHOLD &&
            edgeA.type !== 'open' &&
            edgeB.type !== 'open';
          pushIssue(result, {
            code: 'ROOM_EDGE_MISMATCH',
            severity: meaningfulOverlap ? 'error' : 'warning',
            message: `Shared edge mismatch between rooms "${edgeA.room.id}" and "${edgeB.room.id}" (${edgeA.type} vs ${edgeB.type}).`,
            levelId: level.id,
            roomIds: [edgeA.room.id, edgeB.room.id],
            edge: { a: edgeA.a, b: edgeA.b },
            meta: {
              edgeAIndex: edgeA.edgeIndex,
              edgeBIndex: edgeB.edgeIndex,
              edgeAType: edgeA.type,
              edgeBType: edgeB.type,
              overlapLength: overlap,
              overlapRatio: sharedRatio,
              mismatchLengthThreshold: EDGE_MISMATCH_LENGTH_THRESHOLD,
              mismatchRatioThreshold: EDGE_MISMATCH_RATIO_THRESHOLD,
            },
          });
        }
      }
    }

    for (const grouped of groupedTJunctions.values()) {
      pushIssue(result, {
        code: 'ROOM_T_JUNCTION',
        severity: 'info',
        message: `Rooms "${grouped.roomAId}" and "${grouped.roomBId}" form ${grouped.count} T-junction connection(s).`,
        levelId: level.id,
        roomIds: [grouped.roomAId, grouped.roomBId],
        edge: { a: grouped.edgeA.a, b: grouped.edgeA.b },
        meta: { groupedBy: 'roomPair', count: grouped.count, edgeAIndex: grouped.edgeA.edgeIndex, edgeBIndex: grouped.edgeB.edgeIndex },
      });
    }

    for (const grouped of groupedPartialShares.values()) {
      const isError =
        grouped.maxRatio > PARTIAL_SHARED_EDGE_ERROR_RATIO &&
        grouped.maxMisalignment > VALIDATION_TOLERANCES.coordinateEpsilon;
      pushIssue(result, {
        code: 'ROOM_PARTIAL_SHARED_EDGE',
        severity: isError ? 'error' : 'warning',
        message: `Rooms "${grouped.roomAId}" and "${grouped.roomBId}" have ${grouped.count} partial shared edge segment(s).`,
        levelId: level.id,
        roomIds: [grouped.roomAId, grouped.roomBId],
        edge: { a: grouped.edge.a, b: grouped.edge.b },
        meta: {
          groupedBy: 'roomPair',
          count: grouped.count,
          overlapLength: grouped.maxOverlap,
          overlapRatio: grouped.maxRatio,
          misalignmentDistance: grouped.maxMisalignment,
          errorOverlapRatioThreshold: PARTIAL_SHARED_EDGE_ERROR_RATIO,
          misalignmentTolerance: VALIDATION_TOLERANCES.coordinateEpsilon,
        },
      });
    }

    const footprintPolygon = toPolygon(level.footprint.outer);
    if (levelRooms.length === 0) {
      const footprintArea = Math.abs(polygonSignedArea(level.footprint.outer));
      if (footprintArea > AREA_EPSILON) {
        const severity: ValidationSeverity =
          footprintArea >= GAP_ERROR_AREA ? 'error' : footprintArea >= GAP_WARNING_AREA ? 'warning' : 'info';
        pushIssue(result, {
          code: 'ROOM_GAP_IN_FOOTPRINT',
          severity,
          message: `Level "${level.id}" footprint is not covered by rooms.`,
          levelId: level.id,
          polygon: level.footprint.outer,
          meta: { uncoveredArea: footprintArea },
        });
        result.perLevel[level.id].uncoveredPolygons = [level.footprint.outer];
      }
      continue;
    }

    const roomPolygons = levelRooms.map((room) => toPolygon(room.polygon));
    const [firstPolygon, ...restPolygons] = roomPolygons;
    const union = polygonClipping.union(firstPolygon, ...restPolygons);
    result.perLevel[level.id].coveredPolygons = flattenOuterRings(union);
    const uncovered = polygonClipping.difference(footprintPolygon, union);
    const uncoveredArea = polygonsArea(uncovered);

    if (uncoveredArea >= GAP_WARNING_AREA) {
      const uncoveredPolygons = flattenOuterRings(uncovered);
      result.perLevel[level.id].uncoveredPolygons = uncoveredPolygons;
      const severity: ValidationSeverity = uncoveredArea >= GAP_ERROR_AREA ? 'error' : 'warning';
      pushIssue(result, {
        code: 'ROOM_GAP_IN_FOOTPRINT',
        severity,
        message: `Level "${level.id}" has uncovered footprint area ${uncoveredArea.toFixed(4)}.`,
        levelId: level.id,
        meta: { uncoveredArea, uncoveredPolygonCount: uncoveredPolygons.length },
      });
    } else if (uncoveredArea > AREA_EPSILON) {
      result.perLevel[level.id].uncoveredPolygons = flattenOuterRings(uncovered);
      pushIssue(result, {
        code: 'ROOM_MICRO_GAP',
        severity: 'info',
        message: `Level "${level.id}" has micro uncovered area ${uncoveredArea.toFixed(4)}m².`,
        levelId: level.id,
        meta: { uncoveredArea },
      });
    }

    for (let i = 0; i < levelEdges.length; i += 1) {
      const edge = levelEdges[i];
      const isExterior = isEdgeOnFootprintBoundary(edge, level.footprint.outer);
      const isOpen = edge.type === 'open';
      const tinyResidual = isTinyResidualEdge(edge);

      if (isExterior) {
        upsertAdjacencyEdge(adjacencyEdges, {
          roomAId: edge.room.id,
          roomBId: edge.room.id,
          sharedLength: edgeLength(edge),
          relationshipType: 'exterior_boundary',
          overlapRatio: 1,
          hasTypeMismatch: false,
          hasTJunction: false,
        });
      }
      if (isOpen) {
        upsertAdjacencyEdge(adjacencyEdges, {
          roomAId: edge.room.id,
          roomBId: edge.room.id,
          sharedLength: edgeLength(edge),
          relationshipType: 'open_transition',
          overlapRatio: 1,
          hasTypeMismatch: false,
          hasTJunction: false,
        });
      }
      if (tinyResidual) {
        pushIssue(result, {
          code: 'ROOM_FRAGMENT_EDGE',
          severity: 'info',
          message: `Room "${edge.room.id}" edge ${edge.edgeIndex} is a tiny residual fragment.`,
          levelId: level.id,
          roomIds: [edge.room.id],
          edge: { a: edge.a, b: edge.b },
          meta: { edgeLength: edgeLength(edge), threshold: TINY_RESIDUAL_EDGE_LENGTH, groupedBy: 'roomId' },
        });
      }

      let hasExactShared = false;
      let hasPartialShared = false;
      let hasTJunction = false;
      let maxOverlap = 0;

      for (let j = 0; j < levelEdges.length; j += 1) {
        if (i === j) continue;
        const other = levelEdges[j];
        if (other.room.id === edge.room.id) continue;

        const relationship = classifyEdgeRelationship(edge, other);
        if (relationship === 'exact_shared') {
          hasExactShared = true;
          maxOverlap = Math.max(maxOverlap, edgeOverlapLength(edge, other));
        } else if (relationship === 'partial_shared') {
          hasPartialShared = true;
          maxOverlap = Math.max(maxOverlap, edgeOverlapLength(edge, other));
        } else if (relationship === 't_junction') {
          hasTJunction = true;
        }
      }

      const hasNonTrivialAdjacency =
        hasExactShared || hasPartialShared || maxOverlap > TOPOLOGY_MIN_SHARED_OVERLAP || hasTJunction;

      if (!isExterior && !isOpen && !tinyResidual && !hasNonTrivialAdjacency) {
        pushIssue(result, {
          code: 'ROOM_UNCLOSED_TOPOLOGY',
          severity: 'error',
          message: `Room "${edge.room.id}" has interior edge ${edge.edgeIndex} without matching adjacent room edge.`,
          levelId: level.id,
          roomIds: [edge.room.id],
          edge: { a: edge.a, b: edge.b },
          meta: { edgeIndex: edge.edgeIndex, relationship: 'isolated' },
        });
      }
    }
    result.perLevel[level.id].adjacencyEdges = Array.from(adjacencyEdges.values());
  }

  result.issueCount = result.issues.length;
  result.ok = result.errorCount === 0;
  return result;
}

export function validateFloorplanReport(architecturalHouse: ArchitecturalHouse): ValidationIssue[] {
  return validateFloorplan(architecturalHouse).issues;
}
