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
const MIN_MEANINGFUL_MISMATCH_OVERLAP = 0.5;
const MIN_MEANINGFUL_MISMATCH_RATIO = 0.25;
const EDGE_EPS = 0.01;

type Segment = {
  a: Vec2;
  b: Vec2;
};

type RoomEdge = Segment & {
  room: RoomSpec;
  edgeIndex: number;
  type: RoomEdgeSpec['type'];
};

type PairRelationshipSummary = {
  roomAId: string;
  roomBId: string;
  exactSharedCount: number;
  partialSharedCount: number;
  tJunctionCount: number;
  cornerTouchCount: number;
  mismatchCount: number;
  totalSharedLength: number;
  totalPartialLength: number;
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

function areEdgesCollinearWithinTolerance(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): boolean {
  const abx = edgeA.b.x - edgeA.a.x;
  const abz = edgeA.b.z - edgeA.a.z;
  const bdx = edgeB.b.x - edgeB.a.x;
  const bdz = edgeB.b.z - edgeB.a.z;
  const lenA = Math.hypot(abx, abz);
  const lenB = Math.hypot(bdx, bdz);
  if (lenA <= eps || lenB <= eps) return false;
  const crossDir = Math.abs(cross2(abx / lenA, abz / lenA, bdx / lenB, bdz / lenB));
  if (crossDir > eps * 2) return false;
  const crossOffsetA = Math.abs(cross2(abx, abz, edgeB.a.x - edgeA.a.x, edgeB.a.z - edgeA.a.z)) / lenA;
  const crossOffsetB = Math.abs(cross2(abx, abz, edgeB.b.x - edgeA.a.x, edgeB.b.z - edgeA.a.z)) / lenA;
  return crossOffsetA <= eps * 2 && crossOffsetB <= eps * 2;
}

function isEndpointTouchOnly(edgeA: Segment, edgeB: Segment, eps: number = VALIDATION_TOLERANCES.cornerTouchDistance): boolean {
  const touchesAtEndpoint =
    Math.hypot(edgeA.a.x - edgeB.a.x, edgeA.a.z - edgeB.a.z) <= eps ||
    Math.hypot(edgeA.a.x - edgeB.b.x, edgeA.a.z - edgeB.b.z) <= eps ||
    Math.hypot(edgeA.b.x - edgeB.a.x, edgeA.b.z - edgeB.a.z) <= eps ||
    Math.hypot(edgeA.b.x - edgeB.b.x, edgeA.b.z - edgeB.b.z) <= eps;
  return touchesAtEndpoint && edgeOverlapLength(edgeA, edgeB) <= EPSILON;
}

function isMeaningfulOverlap(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): boolean {
  if (!areEdgesCollinearWithinTolerance(edgeA, edgeB, eps)) {
    return false;
  }
  return edgeOverlapLength(edgeA, edgeB, eps) > eps;
}

function isPointOnSegmentInterior(point: Vec2, edge: Segment, eps: number = EPSILON): boolean {
  return isPointOnSegment(point, edge, eps) && !pointsNearlyEqual(point, edge.a) && !pointsNearlyEqual(point, edge.b);
}

function hasEndpointTerminatingOnOtherEdgeInterior(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): boolean {
  return isPointOnSegmentInterior(edgeA.a, edgeB, eps) || isPointOnSegmentInterior(edgeA.b, edgeB, eps);
}

function hasContainedEdgeWithinTolerance(edgeA: Segment, edgeB: Segment, eps: number = EDGE_EPS): boolean {
  if (!areEdgesCollinearWithinTolerance(edgeA, edgeB, eps)) {
    return false;
  }

  const overlap = edgeOverlapLength(edgeA, edgeB, eps);
  const minLen = Math.min(edgeLength(edgeA), edgeLength(edgeB));
  return overlap >= minLen - eps;
}

type EdgeRelationship = 'exact_shared' | 'partial_shared' | 't_junction' | 'corner_touch' | 'disjoint';

function classifyEdgeRelationship(edgeA: Segment, edgeB: Segment, eps: number = EPSILON): EdgeRelationship {
  const overlap = isMeaningfulOverlap(edgeA, edgeB, eps) ? edgeOverlapLength(edgeA, edgeB, eps) : 0;
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

  if (isEndpointTouchOnly(edgeA, edgeB)) {
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

function requiresAdjacentRoomEdge(edgeType: RoomEdgeSpec['type'] | string): boolean {
  return edgeType === 'wall' || edgeType === 'partition' || edgeType === 'interior';
}

function roomPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function quantize(value: number, decimals: number = 3): string {
  return value.toFixed(decimals);
}

function edgeGeometrySignature(edge: Segment): string {
  const points = [edge.a, edge.b].sort((p1, p2) => (p1.x === p2.x ? p1.z - p2.z : p1.x - p2.x));
  return `${quantize(points[0].x)},${quantize(points[0].z)}:${quantize(points[1].x)},${quantize(points[1].z)}`;
}

function boundarySignature(edgeA: Segment, edgeB: Segment): string {
  if (!areEdgesCollinearWithinTolerance(edgeA, edgeB)) {
    return `edge:${edgeGeometrySignature(edgeA)}|${edgeGeometrySignature(edgeB)}`;
  }
  const base = edgeLength(edgeA) >= edgeLength(edgeB) ? edgeA : edgeB;
  const dx = base.b.x - base.a.x;
  const dz = base.b.z - base.a.z;
  const len = Math.hypot(dx, dz);
  const ux = dx / Math.max(len, EPSILON);
  const uz = dz / Math.max(len, EPSILON);
  const canonicalUx = ux > 0 || (Math.abs(ux) <= EPSILON && uz >= 0) ? ux : -ux;
  const canonicalUz = ux > 0 || (Math.abs(ux) <= EPSILON && uz >= 0) ? uz : -uz;
  const nx = -canonicalUz;
  const nz = canonicalUx;
  const offset = nx * base.a.x + nz * base.a.z;

  const project = (p: Vec2) => p.x * canonicalUx + p.z * canonicalUz;
  const aMin = Math.min(project(edgeA.a), project(edgeA.b));
  const aMax = Math.max(project(edgeA.a), project(edgeA.b));
  const bMin = Math.min(project(edgeB.a), project(edgeB.b));
  const bMax = Math.max(project(edgeB.a), project(edgeB.b));
  const iMin = Math.max(aMin, bMin);
  const iMax = Math.min(aMax, bMax);

  return `line:${quantize(nx)},${quantize(nz)},${quantize(offset)}|interval:${quantize(iMin)}:${quantize(iMax)}`;
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
    const issueDedupe = new Set<string>();
    const pairRelationship = new Map<string, PairRelationshipSummary>();
    const groupedTJunctions = new Map<string, { roomAId: string; roomBId: string; boundaryKey: string; edgeA: RoomEdge; edgeB: RoomEdge; count: number }>();
    const groupedPartialShares = new Map<
      string,
      {
        roomAId: string;
        roomBId: string;
        boundaryKey: string;
        edge: RoomEdge;
        overlapCount: number;
        totalOverlapLength: number;
        maxOverlapRatio: number;
        maxMisalignment: number;
        explainedByTJunctionOnly: boolean;
        hasContainedEdge: boolean;
      }
    >();
    const groupedMismatches = new Map<
      string,
      {
        roomAId: string;
        roomBId: string;
        boundaryKey: string;
        edge: RoomEdge;
        edgeAType: RoomEdgeSpec['type'];
        edgeBType: RoomEdgeSpec['type'];
        overlapLength: number;
        overlapRatio: number;
      }
    >();
    const cornerTouchByPair = new Map<string, { roomAId: string; roomBId: string; edgeA: RoomEdge; edgeB: RoomEdge; count: number }>();
    const explainedInteriorEdges = new Set<string>();
    const edgeId = (edge: RoomEdge) => `${edge.room.id}|${edge.edgeIndex}`;
    let levelHasRoomOverlapArea = false;
    const getPairSummary = (roomAId: string, roomBId: string): PairRelationshipSummary => {
      const key = roomPairKey(roomAId, roomBId);
      const existing = pairRelationship.get(key);
      if (existing) return existing;
      const [a, b] = [roomAId, roomBId].sort();
      const created: PairRelationshipSummary = {
        roomAId: a,
        roomBId: b,
        exactSharedCount: 0,
        partialSharedCount: 0,
        tJunctionCount: 0,
        cornerTouchCount: 0,
        mismatchCount: 0,
        totalSharedLength: 0,
        totalPartialLength: 0,
      };
      pairRelationship.set(key, created);
      return created;
    };
    const pushDedupedIssue = (issue: ValidationIssue, geometricSignature?: string): void => {
      const sortedRooms = [...(issue.roomIds ?? [])].sort().join('|');
      const key = [issue.code, issue.levelId ?? 'none', sortedRooms, geometricSignature ?? 'none'].join('|');
      if (issueDedupe.has(key)) {
        return;
      }
      issueDedupe.add(key);
      pushIssue(result, issue);
    };

    for (let i = 0; i < levelRooms.length; i += 1) {
      const roomA = levelRooms[i];
      const polyA = toPolygon(roomA.polygon);

      for (let j = i + 1; j < levelRooms.length; j += 1) {
        const roomB = levelRooms[j];
        const polyB = toPolygon(roomB.polygon);

        const overlap = polygonClipping.intersection(polyA, polyB);
        const overlapArea = polygonsArea(overlap);
        if (overlapArea > AREA_EPSILON) {
          levelHasRoomOverlapArea = true;
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
    const coveredPolygons = flattenOuterRings(union);
    result.perLevel[level.id].coveredPolygons = coveredPolygons;
    const uncovered = polygonClipping.difference(footprintPolygon, union);
    const uncoveredArea = polygonsArea(uncovered);
    const levelHasUncoveredArea = uncoveredArea > AREA_EPSILON;

    for (let i = 0; i < levelEdges.length; i += 1) {
      const edgeA = levelEdges[i];
      for (let j = i + 1; j < levelEdges.length; j += 1) {
        const edgeB = levelEdges[j];
        if (edgeA.room.id === edgeB.room.id) continue;

        const pairKey = roomPairKey(edgeA.room.id, edgeB.room.id);
        const summary = getPairSummary(edgeA.room.id, edgeB.room.id);
        const relationship = classifyEdgeRelationship(edgeA, edgeB);
        const collinear = areEdgesCollinearWithinTolerance(edgeA, edgeB);
        const overlap = collinear ? edgeOverlapLength(edgeA, edgeB) : 0;
        const sharedRatio = collinear ? overlapRatio(edgeA, edgeB) : 0;
        const minLen = Math.min(edgeLength(edgeA), edgeLength(edgeB));
        const isFullSharedEdge = collinear && overlap >= minLen - EPSILON;
        const hasCollinearTJunctionTermination =
          collinear &&
          overlap > EPSILON &&
          overlap < minLen - EPSILON &&
          (hasEndpointTerminatingOnOtherEdgeInterior(edgeA, edgeB, VALIDATION_TOLERANCES.tJunctionSnapDistance) ||
            hasEndpointTerminatingOnOtherEdgeInterior(edgeB, edgeA, VALIDATION_TOLERANCES.tJunctionSnapDistance));
        const lineKey = boundarySignature(edgeA, edgeB);
        const boundaryKey = `${pairKey}|${lineKey}`;

        if (relationship === 'corner_touch') {
          const existing = cornerTouchByPair.get(pairKey);
          if (!existing) {
            cornerTouchByPair.set(pairKey, { roomAId: edgeA.room.id, roomBId: edgeB.room.id, edgeA, edgeB, count: 1 });
          } else {
            existing.count += 1;
          }
          summary.cornerTouchCount += 1;
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: 0,
            relationshipType: 'corner_touch',
            overlapRatio: 0,
            hasTypeMismatch: false,
            hasTJunction: false,
          });
        }

        if (relationship === 't_junction' || hasCollinearTJunctionTermination) {
          const tKey = `${pairKey}|${lineKey}`;
          const existing = groupedTJunctions.get(tKey);
          if (!existing) {
            groupedTJunctions.set(tKey, { roomAId: edgeA.room.id, roomBId: edgeB.room.id, boundaryKey, edgeA, edgeB, count: 1 });
          } else {
            existing.count += 1;
          }
          summary.tJunctionCount += 1;
          explainedInteriorEdges.add(edgeId(edgeA));
          explainedInteriorEdges.add(edgeId(edgeB));
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

        if (!collinear || overlap <= EPSILON) {
          continue;
        }

        const hasTypeMismatch = edgeA.type !== edgeB.type;
        if (isFullSharedEdge) {
          summary.exactSharedCount += 1;
          summary.totalSharedLength += overlap;
          explainedInteriorEdges.add(edgeId(edgeA));
          explainedInteriorEdges.add(edgeId(edgeB));
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: overlap,
            relationshipType: edgeA.type === 'open' || edgeB.type === 'open' ? 'open_transition' : 'exact_shared',
            overlapRatio: sharedRatio,
            hasTypeMismatch,
            hasTJunction: false,
          });
        } else {
          const misalignmentDistance = endpointMisalignmentDistance(edgeA, edgeB);
          const existing = groupedPartialShares.get(boundaryKey);
          if (!existing) {
            groupedPartialShares.set(boundaryKey, {
              roomAId: edgeA.room.id,
              roomBId: edgeB.room.id,
              boundaryKey,
              edge: edgeA,
              overlapCount: 1,
              totalOverlapLength: overlap,
              maxOverlapRatio: sharedRatio,
              maxMisalignment: misalignmentDistance,
              explainedByTJunctionOnly: false,
              hasContainedEdge: hasContainedEdgeWithinTolerance(edgeA, edgeB),
            });
          } else {
            existing.overlapCount += 1;
            existing.totalOverlapLength += overlap;
            existing.maxOverlapRatio = Math.max(existing.maxOverlapRatio, sharedRatio);
            existing.maxMisalignment = Math.max(existing.maxMisalignment, misalignmentDistance);
            existing.hasContainedEdge = existing.hasContainedEdge || hasContainedEdgeWithinTolerance(edgeA, edgeB);
          }
          summary.partialSharedCount += 1;
          summary.totalPartialLength += overlap;
          explainedInteriorEdges.add(edgeId(edgeA));
          explainedInteriorEdges.add(edgeId(edgeB));
          upsertAdjacencyEdge(adjacencyEdges, {
            roomAId: edgeA.room.id,
            roomBId: edgeB.room.id,
            sharedLength: overlap,
            relationshipType: 'partial_shared',
            overlapRatio: sharedRatio,
            hasTypeMismatch,
            hasTJunction: false,
          });
        }

        const meaningfulMismatchOverlap =
          overlap > MIN_MEANINGFUL_MISMATCH_OVERLAP || sharedRatio > MIN_MEANINGFUL_MISMATCH_RATIO;
        const shouldEmitMismatch =
          hasTypeMismatch &&
          meaningfulMismatchOverlap &&
          !isEndpointTouchOnly(edgeA, edgeB) &&
          edgeA.type !== 'open' &&
          edgeB.type !== 'open';
        if (shouldEmitMismatch) {
          const existingMismatch = groupedMismatches.get(boundaryKey);
          if (!existingMismatch || existingMismatch.overlapLength < overlap) {
            groupedMismatches.set(boundaryKey, {
              roomAId: edgeA.room.id,
              roomBId: edgeB.room.id,
              boundaryKey,
              edge: edgeA,
              edgeAType: edgeA.type,
              edgeBType: edgeB.type,
              overlapLength: overlap,
              overlapRatio: sharedRatio,
            });
          }
        }
      }
    }

    for (const grouped of groupedTJunctions.values()) {
      pushDedupedIssue(
        {
          code: 'ROOM_T_JUNCTION',
          severity: 'info',
          message: `Rooms "${grouped.roomAId}" and "${grouped.roomBId}" form ${grouped.count} T-junction connection(s).`,
          levelId: level.id,
          roomIds: [grouped.roomAId, grouped.roomBId],
          edge: { a: grouped.edgeA.a, b: grouped.edgeA.b },
          meta: { groupedBy: 'pairBoundary', count: grouped.count, edgeAIndex: grouped.edgeA.edgeIndex, edgeBIndex: grouped.edgeB.edgeIndex },
        },
        grouped.boundaryKey
      );
    }

    for (const grouped of groupedPartialShares.values()) {
      const pairKey = roomPairKey(grouped.roomAId, grouped.roomBId);
      const pairHasTJunction = Array.from(groupedTJunctions.values()).some(
        (t) => roomPairKey(t.roomAId, t.roomBId) === pairKey
      );
      if (pairHasTJunction && grouped.totalOverlapLength <= TOPOLOGY_MIN_SHARED_OVERLAP) {
        grouped.explainedByTJunctionOnly = true;
        continue;
      }
      const isError =
        grouped.maxOverlapRatio > PARTIAL_SHARED_EDGE_ERROR_RATIO &&
        grouped.maxMisalignment > VALIDATION_TOLERANCES.coordinateEpsilon;
      const downgradeToWarning =
        grouped.hasContainedEdge && !levelHasRoomOverlapArea && !levelHasUncoveredArea;
      pushDedupedIssue(
        {
          code: 'ROOM_PARTIAL_SHARED_EDGE',
          severity: isError && !downgradeToWarning ? 'error' : 'warning',
          message: `Rooms "${grouped.roomAId}" and "${grouped.roomBId}" partially share a boundary.`,
          levelId: level.id,
          roomIds: [grouped.roomAId, grouped.roomBId],
          edge: { a: grouped.edge.a, b: grouped.edge.b },
          meta: {
            groupedBy: 'pairBoundary',
            overlapCount: grouped.overlapCount,
            totalOverlapLength: Number(grouped.totalOverlapLength.toFixed(3)),
            maxOverlapRatio: Number(grouped.maxOverlapRatio.toFixed(3)),
            misalignmentDistance: grouped.maxMisalignment,
            errorOverlapRatioThreshold: PARTIAL_SHARED_EDGE_ERROR_RATIO,
            misalignmentTolerance: VALIDATION_TOLERANCES.coordinateEpsilon,
            downgradedByContainedEdgeRule: downgradeToWarning,
          },
        },
        grouped.boundaryKey
      );
    }

    for (const grouped of groupedMismatches.values()) {
      const summary = getPairSummary(grouped.roomAId, grouped.roomBId);
      summary.mismatchCount += 1;
      const meaningfulOverlap =
        grouped.overlapLength > EDGE_MISMATCH_LENGTH_THRESHOLD && grouped.overlapRatio > EDGE_MISMATCH_RATIO_THRESHOLD;
      pushDedupedIssue(
        {
          code: 'ROOM_EDGE_MISMATCH',
          severity: meaningfulOverlap ? 'error' : 'warning',
          message: `Shared edge mismatch between rooms "${grouped.roomAId}" and "${grouped.roomBId}" (${grouped.edgeAType} vs ${grouped.edgeBType}).`,
          levelId: level.id,
          roomIds: [grouped.roomAId, grouped.roomBId],
          edge: { a: grouped.edge.a, b: grouped.edge.b },
          meta: {
            groupedBy: 'pairBoundary',
            edgeAType: grouped.edgeAType,
            edgeBType: grouped.edgeBType,
            overlapLength: grouped.overlapLength,
            overlapRatio: grouped.overlapRatio,
            mismatchLengthThreshold: EDGE_MISMATCH_LENGTH_THRESHOLD,
            mismatchRatioThreshold: EDGE_MISMATCH_RATIO_THRESHOLD,
          },
        },
        grouped.boundaryKey
      );
    }

    for (const [pairKey, cornerGroup] of cornerTouchByPair) {
      const summary = pairRelationship.get(pairKey);
      const hasStrongerRelationship =
        (summary?.exactSharedCount ?? 0) > 0 || (summary?.partialSharedCount ?? 0) > 0 || (summary?.tJunctionCount ?? 0) > 0;
      if (hasStrongerRelationship) {
        continue;
      }
      pushDedupedIssue(
        {
          code: 'ROOM_CORNER_TOUCH',
          severity: 'info',
          message: `Rooms "${cornerGroup.roomAId}" and "${cornerGroup.roomBId}" touch at a corner.`,
          levelId: level.id,
          roomIds: [cornerGroup.roomAId, cornerGroup.roomBId],
          edge: { a: cornerGroup.edgeA.a, b: cornerGroup.edgeA.b },
          meta: { groupedBy: 'roomPair', count: cornerGroup.count, edgeAIndex: cornerGroup.edgeA.edgeIndex, edgeBIndex: cornerGroup.edgeB.edgeIndex },
        },
        `${pairKey}|corner_touch`
      );
    }

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
      const isExteriorByGeometry = isEdgeOnFootprintBoundary(edge, level.footprint.outer);
      const isExteriorBySnapTolerance = isEdgeOnFootprintBoundary(edge, level.footprint.outer, EDGE_EPS);
      const isExteriorByType = edge.type === 'exterior';
      const isExteriorCompatible = isExteriorByType || isExteriorByGeometry || isExteriorBySnapTolerance;
      const isOpen = edge.type === 'open';
      const tinyResidual = isTinyResidualEdge(edge);
      const requiresAdjacency = requiresAdjacentRoomEdge(edge.type);

      if (isExteriorCompatible) {
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
      const isExplainedByPairAggregation = explainedInteriorEdges.has(edgeId(edge));

      for (let j = 0; j < levelEdges.length; j += 1) {
        if (i === j) continue;
        const other = levelEdges[j];
        if (other.room.id === edge.room.id) continue;

        const collinear = areEdgesCollinearWithinTolerance(edge, other);
        const relationship = classifyEdgeRelationship(edge, other);
        if (relationship === 'exact_shared') {
          hasExactShared = true;
          if (collinear) {
            maxOverlap = Math.max(maxOverlap, edgeOverlapLength(edge, other));
          }
        } else if (relationship === 'partial_shared') {
          hasPartialShared = true;
          if (collinear) {
            maxOverlap = Math.max(maxOverlap, edgeOverlapLength(edge, other));
          }
        } else if (relationship === 't_junction') {
          hasTJunction = true;
        }
      }

      const hasNonTrivialAdjacency =
        hasExactShared || hasPartialShared || maxOverlap > TOPOLOGY_MIN_SHARED_OVERLAP || hasTJunction || isExplainedByPairAggregation;

      if (requiresAdjacency && !isOpen && !tinyResidual && !isExteriorCompatible && !hasNonTrivialAdjacency) {
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
