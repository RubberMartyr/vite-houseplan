import type { HalfPlane, XZ } from "../types";
import type { DerivedRoofPlan, RoofRegion } from "./types";

function signedSide(p: XZ, a: XZ, b: XZ): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apz = p.z - a.z;
  return apx * abz - apz * abx;
}

function ensureClosed(points: XZ[]): XZ[] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.z === last.z) return points;
  return [...points, first];
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
  const inside = (p: XZ) => {
    const s = signedSide(p, hp.a, hp.b);
    return hp.keep === "left" ? s >= -1e-9 : s <= 1e-9;
  };

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

function capTriangleFromRidgeEndpoint(footprint: XZ[], ridge: { start: XZ; end: XZ }, end: "start" | "end") {
  const E = end === "start" ? ridge.start : ridge.end;
  const t = end === "start" ? 0 : 1;
  const t2 = end === "start" ? 0.02 : 0.98;
  const Pt = {
    x: ridge.start.x + (ridge.end.x - ridge.start.x) * t,
    z: ridge.start.z + (ridge.end.z - ridge.start.z) * t,
  };
  const Pn = {
    x: ridge.start.x + (ridge.end.x - ridge.start.x) * t2,
    z: ridge.start.z + (ridge.end.z - ridge.start.z) * t2,
  };
  const dx = Pn.x - Pt.x;
  const dz = Pn.z - Pt.z;
  const nx = -dz;
  const nz = dx;
  const A = { x: E.x - nx * 1000, z: E.z - nz * 1000 };
  const B = { x: E.x + nx * 1000, z: E.z + nz * 1000 };
  const keep: "left" | "right" = signedSide(Pn, A, B) >= 0 ? "left" : "right";
  const clipped = clipPolyByHalfPlane(footprint, { a: A, b: B, keep });
  return ensureClosed([E, ...clipped.slice(0, -1)]);
}

export function deriveHipCapRegions(plan: DerivedRoofPlan): RoofRegion[] {
  const regions: RoofRegion[] = [];
  for (const face of plan.faces) {
    if (face.kind !== "hipCap") continue;
    if (face.region.type !== "ridgeCapTriangle") continue;
    const region = face.region;

    const ridge = plan.ridgeSegments.find((r) => r.id === region.ridgeId);
    if (!ridge) continue;

    regions.push({
      id: face.id,
      ridgeId: ridge.id,
      end: region.end,
      points: capTriangleFromRidgeEndpoint(plan.footprint, ridge, region.end),
    });
  }

  return regions;
}
