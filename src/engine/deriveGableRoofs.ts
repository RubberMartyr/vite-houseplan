import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import type {
  FaceRegion,
  HalfPlane,
  LevelSpec,
  MultiPlaneRoofSpec,
  RidgePerpCut,
  RoofSpec,
  Vec2,
  XZ,
} from "./types";

type RoofPlane = {
  normal: { x: number; y: number; z: number };
  heightAt(x: number, z: number): number;
};
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
import { normalizeMultiPlaneRoof } from "./roof/normalizeMultiPlaneRoof";
import { archArrayToWorld, archToWorldXZ } from "./spaceMapping";

type GableRoofSpec = Extract<RoofSpec, { type: "gable" }>;
type MultiRidgeRoofSpec = Extract<RoofSpec, { type: "multi-ridge" }>;
type StructuralRoofSpec = GableRoofSpec | MultiRidgeRoofSpec;
type RidgeLine = {
  start: Vec2;
  end: Vec2;
  height: number;
  hipStart?: boolean;
  hipEnd?: boolean;
};

// Helper: convert Vec2[] -> arrays for triangulation
function toTHREEVec2(points: XZ[]) {
  return points.map((p) => new THREE.Vector2(p.x, p.z));
}

function ensureClosed(points: XZ[]): XZ[] {
  const deduped = dedupeConsecutivePoints(points);
  if (deduped.length < 3) return deduped;

  const first = deduped[0];
  const last = deduped[deduped.length - 1];
  if (first.x === last.x && first.z === last.z) return deduped;

  return [...deduped, first];
}

function dedupeConsecutivePoints(points: XZ[]): XZ[] {
  if (points.length < 3) return points;

  const deduped: XZ[] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev.x - point.x) > 1e-9 || Math.abs(prev.z - point.z) > 1e-9) {
      deduped.push(point);
    }
  }

  return deduped;
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
  const a = hp.a;
  const b = hp.b;

  const inside = (p: XZ) => {
    const s = signedSide(p, a, b);
    return hp.keep === "left" ? s >= -1e-9 : s <= 1e-9;
  };

  const closed = ensureClosed(poly);
  const out: XZ[] = [];

  for (let i = 0; i < closed.length - 1; i++) {
    const P = closed[i];
    const Q = closed[i + 1];
    const Pin = inside(P);
    const Qin = inside(Q);

    if (Pin && Qin) {
      out.push(Q);
    } else if (Pin && !Qin) {
      const I = intersectSegmentWithLine(P, Q, a, b);
      if (I) out.push(I);
    } else if (!Pin && Qin) {
      const I = intersectSegmentWithLine(P, Q, a, b);
      if (I) out.push(I);
      out.push(Q);
    }
  }

  const cleaned: XZ[] = [];
  for (const p of out) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.abs(last.x - p.x) > 1e-9 || Math.abs(last.z - p.z) > 1e-9) {
      cleaned.push(p);
    }
  }

  if (cleaned.length >= 3) {
    const f = cleaned[0];
    const l = cleaned[cleaned.length - 1];
    if (f.x !== l.x || f.z !== l.z) cleaned.push({ ...f });
  }

  return cleaned;
}

function clipPolyByRegion(poly: XZ[], region: HalfPlane[]): XZ[] {
  let out = poly;
  for (const hp of region) {
    out = clipPolyByHalfPlane(out, hp);
    if (out.length < 4) return out;
  }
  return out;
}

function ridgePointAt(ridge: { start: XZ; end: XZ }, t: number): XZ {
  return {
    x: ridge.start.x + (ridge.end.x - ridge.start.x) * t,
    z: ridge.start.z + (ridge.end.z - ridge.start.z) * t,
  };
}

function ridgePerpCutToHalfPlane(
  ridge: { start: XZ; end: XZ },
  t: number,
  keep: "ahead" | "behind"
): HalfPlane {
  const E = ridgePointAt(ridge, t);

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

  if (keep === "ahead") return { a: A, b: B, keep: keepAhead };
  return { a: A, b: B, keep: keepAhead === "left" ? "right" : "left" };
}

function resolveFaceRegionToHalfPlanes(
  region: FaceRegion,
  roof: MultiPlaneRoofSpec
): HalfPlane[] | null {
  if (region.type === "halfPlanes") return region.planes;
  if (region.type !== "compound") return null;

  const halfPlanes: HalfPlane[] = [];
  for (const item of region.items) {
    const cut = item as RidgePerpCut;
    if (cut.type === "ridgePerpCut") {
      const ridge = roof.ridgeSegments.find((r) => r.id === cut.ridgeId);
      if (!ridge) return null;
      halfPlanes.push(ridgePerpCutToHalfPlane(ridge, cut.t, cut.keep));
      continue;
    }

    halfPlanes.push(item as HalfPlane);
  }

  return halfPlanes;
}

function intersectSegmentWithInfiniteLine(p: XZ, q: XZ, a: XZ, b: XZ): XZ | null {
  const r = { x: q.x - p.x, z: q.z - p.z };
  const s = { x: b.x - a.x, z: b.z - a.z };

  const denom = r.x * s.z - r.z * s.x;
  if (Math.abs(denom) < 1e-9) return null;

  const ap = { x: a.x - p.x, z: a.z - p.z };
  const t = (ap.x * s.z - ap.z * s.x) / denom;

  if (t < -1e-9 || t > 1 + 1e-9) return null;

  return { x: p.x + t * r.x, z: p.z + t * r.z };
}

function intersectPolygonWithInfiniteLine(polyClosed: XZ[], a: XZ, b: XZ): XZ[] {
  const hits: XZ[] = [];
  const poly = ensureClosed(polyClosed);

  for (let i = 0; i < poly.length - 1; i++) {
    const P = poly[i];
    const Q = poly[i + 1];
    const I = intersectSegmentWithInfiniteLine(P, Q, a, b);
    if (I) hits.push(I);
  }

  const out: XZ[] = [];
  for (const h of hits) {
    if (!out.some((o) => Math.abs(o.x - h.x) < 1e-6 && Math.abs(o.z - h.z) < 1e-6)) out.push(h);
  }
  return out;
}

function capTriangleFromRidgeEndpoint(
  fpClosed: XZ[],
  ridge: { start: XZ; end: XZ },
  end: 'start' | 'end'
): XZ[] | null {
  const E = end === 'start' ? ridge.start : ridge.end;

  const dx = ridge.end.x - ridge.start.x;
  const dz = ridge.end.z - ridge.start.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;

  const ux = dx / len;
  const uz = dz / len;

  const nx = -uz;
  const nz = ux;

  const poly = ensureClosed(fpClosed);
  let tExtreme = end === 'start' ? Infinity : -Infinity;

  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i];
    const t = (p.x - ridge.start.x) * ux + (p.z - ridge.start.z) * uz;

    if (end === 'start') {
      if (t < tExtreme) tExtreme = t;
    } else {
      if (t > tExtreme) tExtreme = t;
    }
  }

  if (!Number.isFinite(tExtreme)) return null;

  const C = {
    x: ridge.start.x + ux * tExtreme,
    z: ridge.start.z + uz * tExtreme,
  };

  const A = { x: C.x - nx * 1000, z: C.z - nz * 1000 };
  const B = { x: C.x + nx * 1000, z: C.z + nz * 1000 };

  const hits = intersectPolygonWithInfiniteLine(fpClosed, A, B);

  if (hits.length < 2) return null;

  let i1 = hits[0];
  let i2 = hits[1];
  let best = -Infinity;
  for (let i = 0; i < hits.length; i++) {
    for (let j = i + 1; j < hits.length; j++) {
      const ddx = hits[j].x - hits[i].x;
      const ddz = hits[j].z - hits[i].z;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 > best) {
        best = d2;
        i1 = hits[i];
        i2 = hits[j];
      }
    }
  }

  return ensureClosed([E, i1, i2]);
}

function clipPolyByLine(poly: XZ[], a: XZ, b: XZ, keep: "pos" | "neg"): XZ[] {
  const closed = ensureClosed(poly);

  const inside = (p: XZ) => {
    const s = signedSide(p, a, b);
    return keep === "pos" ? s >= -1e-9 : s <= 1e-9;
  };

  const out: XZ[] = [];

  for (let i = 0; i < closed.length - 1; i++) {
    const P = closed[i];
    const Q = closed[i + 1];

    const Pin = inside(P);
    const Qin = inside(Q);

    if (Pin && Qin) {
      out.push(Q);
    } else if (Pin && !Qin) {
      const I = intersectSegmentWithLine(P, Q, a, b);
      if (I) out.push(I);
    } else if (!Pin && Qin) {
      const I = intersectSegmentWithLine(P, Q, a, b);
      if (I) out.push(I);
      out.push(Q);
    }
  }

  const cleaned: XZ[] = [];
  for (const p of out) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.abs(last.x - p.x) > 1e-9 || Math.abs(last.z - p.z) > 1e-9) {
      cleaned.push(p);
    }
  }

  if (cleaned.length >= 3) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first.x !== last.x || first.z !== last.z) cleaned.push({ ...first });
  }

  return cleaned;
}

function splitPolygonByRidgeLine(poly: XZ[], a: XZ, b: XZ) {
  const pos = clipPolyByLine(poly, a, b, "pos");
  const neg = clipPolyByLine(poly, a, b, "neg");
  return { pos, neg };
}

function triangulateXZ(polyClosed: XZ[]): number[][] {
  const contour = polyClosed.slice(0, -1).map((p) => new THREE.Vector2(p.x, p.z));
  return THREE.ShapeUtils.triangulateShape(contour, []);
}

function planeFromArchPoints(
  p1: { x: number; z: number; y: number },
  p2: { x: number; z: number; y: number },
  p3: { x: number; z: number; y: number }
): RoofPlane | null {
  const w1 = archToWorldXZ(p1);
  const w2 = archToWorldXZ(p2);
  const w3 = archToWorldXZ(p3);

  return planeFrom3Points(
    { x: w1.x, z: w1.z, y: p1.y },
    { x: w2.x, z: w2.z, y: p2.y },
    { x: w3.x, z: w3.z, y: p3.y }
  );
}

function buildRoofFaceGeometry(params: {
  faceId: string;
  polyClosed: XZ[];
  triangles: number[][];
  thickness: number;
  heightAtOuter: (x: number, z: number) => number;
}): THREE.BufferGeometry | null {
  const { faceId, polyClosed, triangles, thickness, heightAtOuter } = params;
  const poly = polyClosed.slice(0, -1).map(archToWorldXZ);

  const topVerts: number[] = [];
  const botVerts: number[] = [];
  let hasInvalidHeight = false;

  for (const p of poly) {
    const yTop = heightAtOuter(p.x, p.z);
    const yBot = yTop - thickness;

    if (!Number.isFinite(yTop) || !Number.isFinite(yBot)) {
      console.warn("[roof] NaN height at", { faceId, x: p.x, z: p.z, yTop, yBot });
      hasInvalidHeight = true;
      break;
    }

    topVerts.push(p.x, yTop, p.z);
    botVerts.push(p.x, yBot, p.z);
  }


  if (hasInvalidHeight) return null;

  const indices: number[] = [];
  for (const tri of triangles) indices.push(tri[0], tri[1], tri[2]);

  const bottomOffset = poly.length;
  for (const tri of triangles) {
    indices.push(bottomOffset + tri[2], bottomOffset + tri[1], bottomOffset + tri[0]);
  }

  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ti = i;
    const tj = j;
    const bi = bottomOffset + i;
    const bj = bottomOffset + j;
    indices.push(ti, tj, bj);
    indices.push(ti, bj, bi);
  }

  const positions = new Float32Array([...topVerts, ...botVerts]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export function deriveGableRoofGeometries(
  arch: ArchitecturalHouse,
  options: { invalidRoofIds?: Set<string> } = {}
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs ?? []) {
    if (roof.type !== "gable" && roof.type !== "multi-ridge" && roof.type !== "multi-plane") continue;

    if (roof.type === "gable") {
      const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
      if (!baseLevel) continue;

      const geom = buildStructuralGableGeometry(baseLevel, roof);
      geometries.push(geom);
    }

    if (roof.type === "multi-ridge") {
      const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
      if (!baseLevel) continue;

      console.log("USING MULTI-RIDGE BUILDER (derived k)");
      const geoms = buildMultiRidgeRoof(baseLevel, roof);
      geometries.push(...geoms);
    }

    if (roof.type === "multi-plane") {
      if (options.invalidRoofIds?.has(roof.id)) {
        continue;
      }
      const normalized = normalizeMultiPlaneRoof(roof);
      const geoms = deriveMultiPlaneRoofGeometries(arch, normalized);
      geometries.push(...geoms);
    }
  }

  return geometries;
}

function deriveMultiPlaneRoofGeometries(
  arch: ArchitecturalHouse,
  roof: MultiPlaneRoofSpec
): THREE.BufferGeometry[] {
  const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
  if (!baseLevel) return [];

  const thickness = roof.thickness ?? 0.2;

  let fp: XZ[] = baseLevel.footprint.outer;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }
  fp = ensureClosed(fp);

  const geometries: THREE.BufferGeometry[] = [];
  const hipBases = new Map<string, { start?: [XZ, XZ]; end?: [XZ, XZ] }>();
  const sidePlanes = new Map<
    string,
    { left?: RoofPlane; right?: RoofPlane }
  >();

  const facesHip = roof.faces.filter((f) => f.kind === "hipCap");
  const facesRidge = roof.faces.filter((f) => f.kind !== "hipCap");

  const processFace = (face: MultiPlaneRoofSpec["faces"][number]) => {
    const region = face.region;
    let regionPoly: XZ[] | null = null;

    if (region.type === "ridgeCapTriangle") {
      const ridge = roof.ridgeSegments.find((r) => r.id === region.ridgeId);
      if (!ridge) return;

      regionPoly = capTriangleFromRidgeEndpoint(fp, ridge, region.end);
    } else {
      const halfPlanes = resolveFaceRegionToHalfPlanes(region, roof);
      if (!halfPlanes) return;
      regionPoly = clipPolyByRegion(fp, halfPlanes);
    }

    console.log("FACE", face.id, "kind", face.kind, "regionPoly", regionPoly?.length);

    if (!regionPoly || regionPoly.length < 4) return;

    if (face.kind === "hipCap" && face.region.type === "ridgeCapTriangle") {
      const ridgeId = face.region.ridgeId;
      const end = face.region.end;
      const B1 = regionPoly[1];
      const B2 = regionPoly[2];

      const entry = hipBases.get(ridgeId) ?? {};
      entry[end] = [B1, B2];
      hipBases.set(ridgeId, entry);
    }

    let plane: RoofPlane | null = null;

    if (face.kind === "hipCap") {
      if (region.type === "ridgeCapTriangle") {
        console.log("CAP TRIANGLE:", face.id, regionPoly);

        const ridge = roof.ridgeSegments.find((r) => r.id === region.ridgeId);
        if (!ridge) return;

        const E = region.end === "start" ? ridge.start : ridge.end;
        const ridgeTopAbs = baseLevel.elevation + ridge.height;
        const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

        const base1 = regionPoly[1];
        const base2 = regionPoly[2];

        plane = planeFromArchPoints(
          { x: E.x, z: E.z, y: ridgeTopAbs },
          { x: base1.x, z: base1.z, y: eaveTopAbs },
          { x: base2.x, z: base2.z, y: eaveTopAbs }
        );
      } else {
        if (!face.p1 || !face.p2 || !face.p3) return;

        plane = planeFromArchPoints(
          { x: face.p1.x, z: face.p1.z, y: baseLevel.elevation + face.p1.h },
          { x: face.p2.x, z: face.p2.z, y: baseLevel.elevation + face.p2.h },
          { x: face.p3.x, z: face.p3.z, y: baseLevel.elevation + face.p3.h }
        );
      }
    } else if (face.kind === "ridgeSideSegment") {
      if (!face.ridgeId || !face.side) return;

      const ridgeSidePlanes = sidePlanes.get(face.ridgeId);
      plane = face.side === "left" ? ridgeSidePlanes?.left ?? null : ridgeSidePlanes?.right ?? null;

      if (plane) {
        console.log("RIDGE FACE USING SIDE PLANE", {
          faceId: face.id,
          side: face.side,
          normal: plane.normal,
        });
      }
    } else {
      return;
    }

    if (!plane) {
      console.warn("[roof] face plane is vertical / invalid for y=f(x,z). Skipping face:", face.id, face);
      return;
    }

    const triangles = triangulateXZ(regionPoly.map(archToWorldXZ));
    const geometry = buildRoofFaceGeometry({
        faceId: face.id,
        polyClosed: regionPoly,
        triangles,
        thickness,
        heightAtOuter: (x, z) => plane.heightAt(x, z),
      });

    if (geometry) {
      geometries.push(geometry);
      console.log("GEOMETRY ADDED:", face.id);
    }
  };

  // PASS 1: build hip caps first (and cache hipBases)
  for (const face of facesHip) {
    processFace(face);
  }

  // PASS 1.5: build 4 corner hip facets (one per ridge end + side)
  for (const ridge of roof.ridgeSegments) {
    const bases = hipBases.get(ridge.id);
    if (!bases?.start || !bases?.end) continue;

    const ridgeTopAbs = baseLevel.elevation + ridge.height;
    const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

    (["start", "end"] as const).forEach((endKey) => {
      (["left", "right"] as const).forEach((side) => {
        const seamPair = bases[endKey];
        if (!seamPair) return;

        // seam base point for that side at that ridge end
        const B = pickBaseForSide(ridge, seamPair, side);
        const C = pickCornerForEndAndSideFromBase(fp, ridge, endKey, side, B);
        if (!C) return;

        const E = endKey === "start" ? ridge.start : ridge.end;

        // Build an explicit triangle poly in arch space (closed)
        const triPoly: XZ[] = ensureClosed([E, C, B]);

        const plane = planeFromArchPoints(
          { x: E.x, z: E.z, y: ridgeTopAbs },
          { x: C.x, z: C.z, y: eaveTopAbs },
          { x: B.x, z: B.z, y: eaveTopAbs }
        );
        if (!plane) return;

        const triangles = triangulateXZ(triPoly.map(archToWorldXZ));
        const geometry = buildRoofFaceGeometry({
          faceId: `corner-${ridge.id}-${endKey}-${side}`,
          polyClosed: triPoly,
          triangles,
          thickness,
          heightAtOuter: (x, z) => plane.heightAt(x, z),
        });

        if (geometry) geometries.push(geometry);
      });
    });
  }

  for (const ridge of roof.ridgeSegments) {
    const bases = hipBases.get(ridge.id);
    if (!bases?.start || !bases?.end) continue;

    const ridgeTopAbs = baseLevel.elevation + ridge.height;
    const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

    const leftStart = pickBaseForSide(ridge, bases.start, "left");
    const leftEnd = pickBaseForSide(ridge, bases.end, "left");
    const leftMid = midXZ(leftStart, leftEnd);

    const rightStart = pickBaseForSide(ridge, bases.start, "right");
    const rightEnd = pickBaseForSide(ridge, bases.end, "right");
    const rightMid = midXZ(rightStart, rightEnd);

    const planeLeft = planeFromArchPoints(
      { x: ridge.start.x, z: ridge.start.z, y: ridgeTopAbs },
      { x: ridge.end.x, z: ridge.end.z, y: ridgeTopAbs },
      { x: leftMid.x, z: leftMid.z, y: eaveTopAbs }
    );

    const planeRight = planeFromArchPoints(
      { x: ridge.start.x, z: ridge.start.z, y: ridgeTopAbs },
      { x: ridge.end.x, z: ridge.end.z, y: ridgeTopAbs },
      { x: rightMid.x, z: rightMid.z, y: eaveTopAbs }
    );

    console.log("SIDE PLANES", {
      leftNormal: planeLeft?.normal,
      rightNormal: planeRight?.normal,
    });

    if (!planeLeft && !planeRight) continue;

    sidePlanes.set(ridge.id, { left: planeLeft ?? undefined, right: planeRight ?? undefined });
  }

  // PASS 2: build ridge-side segments afterwards
  for (const face of facesRidge) {
    processFace(face);
  }

  return geometries;
}

function dist2(a: XZ, b: XZ) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function ridgeParamT(ridge: { start: XZ; end: XZ }, p: XZ): number {
  const vx = ridge.end.x - ridge.start.x;
  const vz = ridge.end.z - ridge.start.z;
  const denom = vx * vx + vz * vz;
  if (denom < 1e-9) return 0;
  const px = p.x - ridge.start.x;
  const pz = p.z - ridge.start.z;
  return (px * vx + pz * vz) / denom;
}

// cross( ridgeDir, point - ridgeStart ) in XZ
function sideOfRidge(ridge: { start: XZ; end: XZ }, p: XZ): "left" | "right" | "on" {
  const vx = ridge.end.x - ridge.start.x;
  const vz = ridge.end.z - ridge.start.z;
  const px = p.x - ridge.start.x;
  const pz = p.z - ridge.start.z;
  const cross = vx * pz - vz * px;
  if (Math.abs(cross) < 1e-9) return "on";
  return cross > 0 ? "left" : "right";
}

// convex corner test for a *closed* polygon (last point == first point)
function isConvexVertex(prev: XZ, cur: XZ, next: XZ): boolean {
  const ax = cur.x - prev.x;
  const az = cur.z - prev.z;
  const bx = next.x - cur.x;
  const bz = next.z - cur.z;
  const cross = ax * bz - az * bx;
  // depending on winding this sign flips; we just want "not reflex".
  // we'll treat "large negative" as reflex, ">=0" as convex-ish.
  return cross >= 0;
}

function getConvexCorners(fpClosed: XZ[]): XZ[] {
  const pts = fpClosed.slice(0, -1); // remove duplicate closing point
  if (pts.length < 3) return [];

  const corners: XZ[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    if (isConvexVertex(prev, cur, next)) corners.push(cur);
  }
  return corners;
}

function pickCornerForEndAndSideFromBase(
  fpClosed: XZ[],
  ridge: { start: XZ; end: XZ },
  end: "start" | "end",
  side: "left" | "right",
  B: XZ
): XZ | null {
  const corners = getConvexCorners(fpClosed);
  if (corners.length === 0) return null;

  // 1) Prefer corners on correct ridge side
  let candidates = corners.filter((c) => sideOfRidge(ridge, c) === side);

  // 2) Prefer corners on correct ridge end (using projected t)
  const endFiltered = candidates.filter((c) => {
    const t = ridgeParamT(ridge, c);
    return end === "start" ? t <= 0.35 : t >= 0.65;
  });

  if (endFiltered.length > 0) candidates = endFiltered;
  if (candidates.length === 0) candidates = corners;

  // 3) Choose the corner closest to seam base B (NOT ridge endpoint E)
  let best = candidates[0];
  let bestD = dist2(best, B);
  for (const c of candidates) {
    const d = dist2(c, B);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

function absPerpDistanceToLineXZ(p: XZ, a: XZ, b: XZ): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const cross = (p.x - a.x) * dz - (p.z - a.z) * dx;
  return Math.abs(cross) / len;
}

function pickFarthestPoint(polyClosed: XZ[], a: XZ, b: XZ): XZ | null {
  const poly = polyClosed.slice(0, -1);
  if (poly.length < 3) return null;

  let best = poly[0];
  let bestD = -Infinity;

  for (const p of poly) {
    const d = absPerpDistanceToLineXZ(p, a, b);
    if (d > bestD) {
      bestD = d;
      best = p;
    }
  }

  return best;
}

function midXZ(a: XZ, b: XZ): XZ {
  return { x: (a.x + b.x) * 0.5, z: (a.z + b.z) * 0.5 };
}

function pickBaseForSide(
  ridge: { start: XZ; end: XZ },
  base: [XZ, XZ],
  side: "left" | "right"
): XZ {
  const [b1, b2] = base;
  const s1 = signedSide(b1, ridge.start, ridge.end);
  const s2 = signedSide(b2, ridge.start, ridge.end);

  const isLeft1 = s1 >= 0;
  const isLeft2 = s2 >= 0;

  if (side === "left") {
    if (isLeft1 && !isLeft2) return b1;
    if (isLeft2 && !isLeft1) return b2;
    return s1 >= s2 ? b1 : b2;
  }

  if (!isLeft1 && isLeft2) return b1;
  if (!isLeft2 && isLeft1) return b2;
  return s1 <= s2 ? b1 : b2;
}

function signedPerpDistanceToInfiniteLineXZ(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return ((px - x1) * dz - (pz - z1) * dx) / len;
}

function planeFrom3Points(
  p1: { x: number; z: number; y: number },
  p2: { x: number; z: number; y: number },
  p3: { x: number; z: number; y: number }
): RoofPlane | null {
  const v1 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z,
  };

  const v2 = {
    x: p3.x - p1.x,
    y: p3.y - p1.y,
    z: p3.z - p1.z,
  };

  const nx = v1.y * v2.z - v1.z * v2.y;
  const ny = v1.z * v2.x - v1.x * v2.z;
  const nz = v1.x * v2.y - v1.y * v2.x;

  if (Math.abs(ny) < 1e-9) return null;

  const d = -(nx * p1.x + ny * p1.y + nz * p1.z);

  return {
    normal: { x: nx, y: ny, z: nz },
    heightAt(x: number, z: number) {
      return -(nx * x + nz * z + d) / ny;
    },
  };
}

function intersectPolygonWithHorizontalLine(
  poly: { x: number; z: number }[],
  zLine: number
) {
  const intersections: { x: number; z: number }[] = [];

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];

    if (
      (a.z <= zLine && b.z >= zLine) ||
      (a.z >= zLine && b.z <= zLine)
    ) {
      const dz = b.z - a.z;
      if (Math.abs(dz) < 1e-9) continue;

      const t = (zLine - a.z) / dz;
      const x = a.x + t * (b.x - a.x);

      intersections.push({ x, z: zLine });
    }
  }

  return intersections;
}

function getRoofHeightFunctions(
  fp: Vec2[],
  ridge: RidgeLine,
  ridgeTopAbs: number,
  eaveTopAbs: number,
  thickness: number
) {
  const fpClosed = ensureClosed(fp).map(archToWorldXZ);
  const ridgeStart = archToWorldXZ(ridge.start);
  const ridgeEnd = archToWorldXZ(ridge.end);
  const hipPlanes: ((x: number, z: number) => number)[] = [];

  if (ridge.hipStart) {
    const hits = intersectPolygonWithHorizontalLine(fpClosed, ridgeStart.z);

    if (hits.length === 2) {
      const left = hits[0].x < hits[1].x ? hits[0] : hits[1];
      const right = hits[0].x < hits[1].x ? hits[1] : hits[0];

      const plane = planeFrom3Points(
        { x: ridgeStart.x, z: ridgeStart.z, y: ridgeTopAbs },
        { x: left.x, z: left.z, y: eaveTopAbs },
        { x: right.x, z: right.z, y: eaveTopAbs }
      );

      if (plane) hipPlanes.push((x, z) => plane.heightAt(x, z));
    }
  }

  if (ridge.hipEnd) {
    const hits = intersectPolygonWithHorizontalLine(fpClosed, ridgeEnd.z);

    if (hits.length === 2) {
      const left = hits[0].x < hits[1].x ? hits[0] : hits[1];
      const right = hits[0].x < hits[1].x ? hits[1] : hits[0];

      const plane = planeFrom3Points(
        { x: ridgeEnd.x, z: ridgeEnd.z, y: ridgeTopAbs },
        { x: left.x, z: left.z, y: eaveTopAbs },
        { x: right.x, z: right.z, y: eaveTopAbs }
      );

      if (plane) hipPlanes.push((x, z) => plane.heightAt(x, z));
    }
  }

  let maxRun = 0;

  for (const p of fpClosed) {
    const sd = signedPerpDistanceToInfiniteLineXZ(
      p.x,
      p.z,
      ridgeStart.x,
      ridgeStart.z,
      ridgeEnd.x,
      ridgeEnd.z
    );

    maxRun = Math.max(maxRun, Math.abs(sd));
  }

  const deltaH = ridgeTopAbs - eaveTopAbs;
  const k = maxRun === 0 ? 0 : deltaH / maxRun;

  function ridgePlaneHeight(px: number, pz: number) {
    const sd = signedPerpDistanceToInfiniteLineXZ(
      px,
      pz,
      ridgeStart.x,
      ridgeStart.z,
      ridgeEnd.x,
      ridgeEnd.z
    );

    return ridgeTopAbs - k * Math.abs(sd);
  }

  function roofOuterAt(px: number, pz: number) {
    let h = ridgePlaneHeight(px, pz);

    for (const hip of hipPlanes) {
      h = Math.max(h, hip(px, pz));
    }

    return h;
  }

  function roofBottomAt(px: number, pz: number) {
    return roofOuterAt(px, pz) - thickness;
  }

  return { roofOuterAt, roofBottomAt };
}

function buildMultiRidgeRoof(
  baseLevel: LevelSpec,
  roof: MultiRidgeRoofSpec
): THREE.BufferGeometry[] {
  const ridge = roof.ridgeSegments[0];
  if (!ridge) return [];

  const thickness = roof.thickness ?? 0.2;

  const ridgeTopAbs = baseLevel.elevation + ridge.height;
  const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

  let fp = baseLevel.footprint.outer;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }
  fp = ensureClosed(fp);

  const { roofOuterAt } = getRoofHeightFunctions(
    fp,
    ridge,
    ridgeTopAbs,
    eaveTopAbs,
    thickness
  );

  const { pos, neg } = splitPolygonByRidgeLine(fp, ridge.start, ridge.end);
  const out: THREE.BufferGeometry[] = [];

  if (pos.length >= 4) {
    const posGeometry = buildRoofFaceGeometry({
      faceId: "multi-ridge-pos",
      polyClosed: pos,
      triangles: triangulateXZ(pos.map(archToWorldXZ)),
      thickness,
      heightAtOuter: roofOuterAt,
    });

    if (posGeometry) out.push(posGeometry);
  }
  if (neg.length >= 4) {
    const negGeometry = buildRoofFaceGeometry({
      faceId: "multi-ridge-neg",
      polyClosed: neg,
      triangles: triangulateXZ(neg.map(archToWorldXZ)),
      thickness,
      heightAtOuter: roofOuterAt,
    });

    if (negGeometry) out.push(negGeometry);
  }

  return out;
}

export function buildStructuralGableGeometry(
  baseLevel: LevelSpec,
  roof: StructuralRoofSpec
): THREE.BufferGeometry {
  const thickness = roof.thickness ?? 0.2;
  const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

  const ridge: RidgeLine =
    roof.type === "multi-ridge"
      ? roof.ridgeSegments[0]
      : {
          start: roof.ridge.start,
          end: roof.ridge.end,
          height: roof.ridgeHeight,
        };
  const ridgeTopAbs = baseLevel.elevation + ridge.height;

  let fp = baseLevel.footprint.outer;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }

  const { roofOuterAt, roofBottomAt } = getRoofHeightFunctions(
    fp,
    ridge,
    ridgeTopAbs,
    eaveTopAbs,
    thickness
  );

  const contour = toTHREEVec2(archArrayToWorld(fp));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

  const topVerts: number[] = [];
  const botVerts: number[] = [];

  for (const p of fp) {
    const wp = archToWorldXZ(p);
    const yTop = roofOuterAt(wp.x, wp.z);
    const yBot = roofBottomAt(wp.x, wp.z);

    topVerts.push(wp.x, yTop, wp.z);
    botVerts.push(wp.x, yBot, wp.z);
  }


  const indices: number[] = [];

  for (const tri of triangles) {
    indices.push(tri[0], tri[1], tri[2]);
  }

  const bottomOffset = fp.length;
  for (const tri of triangles) {
    indices.push(bottomOffset + tri[2], bottomOffset + tri[1], bottomOffset + tri[0]);
  }

  const n = fp.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;

    const ti = i;
    const tj = j;
    const bi = bottomOffset + i;
    const bj = bottomOffset + j;

    indices.push(ti, tj, bj);
    indices.push(ti, bj, bi);
  }

  const positions = new Float32Array([...topVerts, ...botVerts]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}
