import type { FaceRegion, HalfPlane, RidgePerpCut, XZ } from "../types";
import type { DerivedRoofPlan, RoofRegion, RoofSeamBase } from "./types";

function ensureClosed(points: XZ[]): XZ[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.z === last.z) return points;
  return [...points, first];
}

function signedSide(p: XZ, a: XZ, b: XZ): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apz = p.z - a.z;
  return apx * abz - apz * abx;
}

function intersectSegmentWithLine(p: XZ, q: XZ, a: XZ, b: XZ): XZ | null {
  const r = { x: q.x - p.x, z: q.z - p.z };
  const s = { x: b.x - a.x, z: b.z - a.z };
  const denom = r.x * s.z - r.z * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const ap = { x: a.x - p.x, z: a.z - p.z };
  const t = (ap.x * s.z - ap.z * s.x) / denom;
  if (t < -1e-9 || t > 1 + 1e-9) return null;
  return { x: p.x + t * r.x, z: p.z + t * r.z };
}

function clipPolyByHalfPlane(poly: XZ[], hp: HalfPlane): XZ[] {
  const inside = (p: XZ) => hp.keep === "left" ? signedSide(p, hp.a, hp.b) >= -1e-9 : signedSide(p, hp.a, hp.b) <= 1e-9;
  const closed = ensureClosed(poly);
  const out: XZ[] = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const P = closed[i];
    const Q = closed[i + 1];
    const Pin = inside(P);
    const Qin = inside(Q);
    if (Pin && Qin) out.push(Q);
    else if (Pin && !Qin) {
      const I = intersectSegmentWithLine(P, Q, hp.a, hp.b);
      if (I) out.push(I);
    } else if (!Pin && Qin) {
      const I = intersectSegmentWithLine(P, Q, hp.a, hp.b);
      if (I) out.push(I);
      out.push(Q);
    }
  }
  return ensureClosed(out);
}

function ridgePerpCutToHalfPlane(
  ridge: { start: XZ; end: XZ },
  t: number,
  keep: "ahead" | "behind"
): HalfPlane {
  const E = { x: ridge.start.x + (ridge.end.x - ridge.start.x) * t, z: ridge.start.z + (ridge.end.z - ridge.start.z) * t };
  const dx = ridge.end.x - ridge.start.x;
  const dz = ridge.end.z - ridge.start.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const nx = -uz;
  const nz = ux;
  const A = { x: E.x - nx * 1000, z: E.z - nz * 1000 };
  const B = { x: E.x + nx * 1000, z: E.z + nz * 1000 };
  const test = { x: E.x + ux * 0.01, z: E.z + uz * 0.01 };
  const s = signedSide(test, A, B);
  const keepAhead: "left" | "right" = s >= 0 ? "left" : "right";
  return keep === "ahead" ? { a: A, b: B, keep: keepAhead } : { a: A, b: B, keep: keepAhead === "left" ? "right" : "left" };
}

function resolveFaceRegionToHalfPlanes(region: FaceRegion, plan: DerivedRoofPlan): HalfPlane[] | null {
  if (region.type === "halfPlanes") return region.planes;
  if (region.type !== "compound") return null;
  const planes: HalfPlane[] = [];
  for (const item of region.items) {
    const cut = item as RidgePerpCut;
    if (cut.type === "ridgePerpCut") {
      const ridge = plan.ridgeSegments.find((r) => r.id === cut.ridgeId);
      if (!ridge) return null;
      planes.push(ridgePerpCutToHalfPlane(ridge, cut.t, cut.keep));
    } else {
      planes.push(item as HalfPlane);
    }
  }
  return planes;
}

export function deriveRidgeSideRegions(plan: DerivedRoofPlan, _seamBases: RoofSeamBase[]): RoofRegion[] {
  const regions: RoofRegion[] = [];
  for (const face of plan.faces) {
    if (face.kind !== "ridgeSideSegment") continue;
    const planes = resolveFaceRegionToHalfPlanes(face.region, plan);
    if (!planes) continue;

    let clipped = ensureClosed(plan.footprint);
    for (const hp of planes) clipped = clipPolyByHalfPlane(clipped, hp);
    if (clipped.length < 4) continue;

    regions.push({
      id: face.id,
      side: face.side,
      ridgeId: face.ridgeId,
      points: clipped,
    });
  }

  return regions;
}
