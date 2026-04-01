import type { XZ } from "../types";
import type { RoofCornerTriangle, RoofPoint, RoofSeamBase } from "./types";

function ensureClosed(points: XZ[]): XZ[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.z === last.z) return points;
  return [...points, first];
}

function samePoint(a: RoofPoint, b: RoofPoint, eps = 1e-6) {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.z - b.z) < eps;
}

function pointOnSegment(point: RoofPoint, start: RoofPoint, end: RoofPoint, eps = 1e-6): boolean {
  const segment = { x: end.x - start.x, z: end.z - start.z };
  const toPoint = { x: point.x - start.x, z: point.z - start.z };
  const cross = segment.x * toPoint.z - segment.z * toPoint.x;
  if (Math.abs(cross) > eps) return false;
  const dot = toPoint.x * segment.x + toPoint.z * segment.z;
  if (dot < -eps) return false;
  const lenSq = segment.x * segment.x + segment.z * segment.z;
  return dot <= lenSq + eps;
}

export function pickCornerFromEdgeContainingBase(footprint: RoofPoint[], seamBase: RoofPoint): RoofPoint | null {
  const closed = ensureClosed(footprint);
  for (let i = 0; i < closed.length - 1; i++) {
    const a = closed[i];
    const b = closed[i + 1];
    if (!pointOnSegment(seamBase, a, b)) continue;
    if (!samePoint(seamBase, a)) return a;
    if (!samePoint(seamBase, b)) return b;
  }
  return null;
}

export function deriveCornerTriangles(
  footprint: RoofPoint[],
  seamBases: RoofSeamBase[],
  ridgeSegments: Array<{ id: string; start: RoofPoint; end: RoofPoint }>,
): RoofCornerTriangle[] {
  const triangles: RoofCornerTriangle[] = [];

  for (const seamBase of seamBases) {
    const ridge = ridgeSegments.find((segment) => segment.id === seamBase.ridgeId);
    if (!ridge) continue;
    const ridgeEnd = seamBase.end === "start" ? ridge.start : ridge.end;
    const corner = pickCornerFromEdgeContainingBase(footprint, seamBase.point);
    if (!corner) continue;
    triangles.push({
      ridgeId: seamBase.ridgeId,
      side: seamBase.side,
      end: seamBase.end,
      corner,
      seamBase: seamBase.point,
      ridgeEnd,
    });
  }

  return triangles;
}
