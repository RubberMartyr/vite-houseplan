import * as THREE from "three";
import type {
  FaceRegion,
  HalfPlane,
  MultiPlaneRoofSpec,
  RidgePerpCut,
  RoofSpec,
  Vec2,
  XZ,
} from "./types";
import type { DerivedRoof } from "./derive/types/DerivedRoof";

type RoofPlane = {
  normal: { x: number; y: number; z: number };
  heightAt(x: number, z: number): number;
};
import { normalizeMultiPlaneRoof } from "./roof/normalizeMultiPlaneRoof";
import { buildRoofGeometry } from "./geometry/buildRoofGeometry";
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

type RoofOverlapVerificationMode = {
  disableCornerFacets: boolean;
  disableHipCapAt?: { ridgeId: string; end: "start" | "end" };
};

function getRoofOverlapVerificationMode(): RoofOverlapVerificationMode {
  if (typeof window === "undefined") {
    return { disableCornerFacets: false };
  }

  const params = new URLSearchParams(window.location.search);
  const hipCapTarget = params.get("disableHipCapAt");

  let disableHipCapAt: RoofOverlapVerificationMode["disableHipCapAt"];
  if (hipCapTarget) {
    const [ridgeId, end] = hipCapTarget.split(":");
    if (ridgeId && (end === "start" || end === "end")) {
      disableHipCapAt = { ridgeId, end };
    }
  }

  return {
    disableCornerFacets: params.get("disableCornerFacets") === "1",
    disableHipCapAt,
  };
}

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

function signedArea(polyClosed: XZ[]): number {
  let area = 0;

  for (let i = 0; i < polyClosed.length - 1; i++) {
    const current = polyClosed[i];
    const next = polyClosed[i + 1];
    area += current.x * next.z - next.x * current.z;
  }

  return area * 0.5;
}

function orientRoofFacePolygon(polyClosed: XZ[]): XZ[] {
  const closed = ensureClosed(polyClosed);
  const worldClosed = closed.map(archToWorldXZ);

  if (signedArea(worldClosed) <= 0) {
    return closed;
  }

  return ensureClosed(closed.slice(0, -1).reverse());
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
  return buildRoofGeometry(positions, indices);
}

export function deriveGableRoofGeometries(
  roofs: DerivedRoof[],
  options: { invalidRoofIds?: Set<string> } = {}
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const derivedRoof of roofs) {
    const roof = derivedRoof.spec as RoofSpec;
    if (roof.type !== "gable" && roof.type !== "multi-ridge" && roof.type !== "multi-plane") continue;

    if (roof.type === "gable") {
      const geom = buildStructuralGableGeometry(derivedRoof, roof);
      geometries.push(geom);
    }

    if (roof.type === "multi-ridge") {
      console.log("USING MULTI-RIDGE BUILDER (derived k)");
      const geoms = buildMultiRidgeRoof(derivedRoof, roof);
      geometries.push(...geoms);
    }

    if (roof.type === "multi-plane") {
      if (options.invalidRoofIds?.has(roof.id)) {
        continue;
      }
      const normalized = normalizeMultiPlaneRoof(roof);
      const geoms = deriveMultiPlaneRoofGeometries(derivedRoof, normalized);
      geometries.push(...geoms);
    }
  }

  return geometries;
}

function deriveMultiPlaneRoofGeometries(
  derivedRoof: DerivedRoof,
  roof: MultiPlaneRoofSpec
): THREE.BufferGeometry[] {
  const verificationMode = getRoofOverlapVerificationMode();
  const thickness = roof.thickness ?? 0.2;

  const fp: XZ[] = ensureClosed(derivedRoof.roofPolygonOuter);

  const geometries: THREE.BufferGeometry[] = [];
  const hipBases = new Map<string, { start?: [XZ, XZ]; end?: [XZ, XZ] }>();
  const faceRegionPolys = new Map<string, XZ[]>();
  const sidePlanes = new Map<
    string,
    { left?: RoofPlane; right?: RoofPlane }
  >();

  const facesHip = roof.faces.filter((f) => f.kind === "hipCap");
  const facesRidge = roof.faces.filter((f) => f.kind !== "hipCap");

  const resolveFaceRegionPoly = (face: MultiPlaneRoofSpec["faces"][number]) => {
    const cached = faceRegionPolys.get(face.id);
    if (cached) return cached;

    const region = face.region;
    let regionPoly: XZ[] | null = null;

    if (region.type === "ridgeCapTriangle") {
      if (
        verificationMode.disableHipCapAt?.ridgeId === region.ridgeId &&
        verificationMode.disableHipCapAt.end === region.end
      ) {
        console.warn("[roof] Verification mode skipping hip-cap triangle", {
          ridgeId: region.ridgeId,
          end: region.end,
          faceId: face.id,
        });
        return;
      }

      const ridge = roof.ridgeSegments.find((r) => r.id === region.ridgeId);
      if (!ridge) return;

      regionPoly = capTriangleFromRidgeEndpoint(fp, ridge, region.end);
    } else {
      const halfPlanes = resolveFaceRegionToHalfPlanes(region, roof);
      if (!halfPlanes) return;
      regionPoly = clipPolyByRegion(fp, halfPlanes);
    }

    if (regionPoly) {
      faceRegionPolys.set(face.id, regionPoly);
    }

    return regionPoly;
  };

  const processFace = (face: MultiPlaneRoofSpec["faces"][number]) => {
    const region = face.region;
    const regionPoly = resolveFaceRegionPoly(face);

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
        const ridgeTopAbs = derivedRoof.baseLevel.elevation + ridge.height;
        const eaveTopAbs = derivedRoof.baseLevel.elevation + roof.eaveHeight;

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
          { x: face.p1.x, z: face.p1.z, y: derivedRoof.baseLevel.elevation + face.p1.h },
          { x: face.p2.x, z: face.p2.z, y: derivedRoof.baseLevel.elevation + face.p2.h },
          { x: face.p3.x, z: face.p3.z, y: derivedRoof.baseLevel.elevation + face.p3.h }
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

    const orientedRegionPoly = orientRoofFacePolygon(regionPoly);
    const triangles = triangulateXZ(orientedRegionPoly.map(archToWorldXZ));
    const geometry = buildRoofFaceGeometry({
        faceId: face.id,
        polyClosed: orientedRegionPoly,
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
  if (verificationMode.disableCornerFacets) {
    console.warn("[roof] Verification mode skipping PASS 1.5 corner facets");
  } else {
    for (const ridge of roof.ridgeSegments) {
      const bases = hipBases.get(ridge.id);
      if (!bases?.start || !bases?.end) continue;

      const ridgeTopAbs = derivedRoof.baseLevel.elevation + ridge.height;
      const eaveTopAbs = derivedRoof.baseLevel.elevation + roof.eaveHeight;

      (["start", "end"] as const).forEach((endKey) => {
        (["left", "right"] as const).forEach((side) => {
          console.log("CORNER TRY", ridge.id, endKey, side);
          const E = endKey === "start" ? ridge.start : ridge.end;

          // Step 2: get seam base for this side
          const seamPair = bases[endKey];
          if (!seamPair) {
            console.warn("No seamPair found", ridge.id, endKey);
            return;
          }

          // seam base point for that side at that ridge end
          const adjacentFace = findAdjacentCornerFace(roof.faces, ridge.id, endKey, side);
          const adjacentPoly = adjacentFace ? resolveFaceRegionPoly(adjacentFace) : null;

          const basePoint = pickBaseForSide(ridge, seamPair, side);
          const sharedBoundary = adjacentPoly
            ? findSharedCornerBoundaryFromAdjacentPatch(adjacentPoly, fp, basePoint)
            : null;

          const B = sharedBoundary?.base ?? snap(basePoint, findVertexReference(adjacentPoly, basePoint) ?? basePoint);
          const fallbackCorner = sharedBoundary ? null : pickCornerFromEdgeContainingBase(fp, B, ridge, side);
          const rawCorner = sharedBoundary?.corner ?? fallbackCorner?.corner ?? null;
          const candidates = sharedBoundary
            ? [sharedBoundary.base, sharedBoundary.corner]
            : fallbackCorner?.candidates ?? [];

          // 🔎 DEBUG LOG
          logCornerDebug(ridge.id, endKey, side, E, B, candidates, rawCorner);

          if (!rawCorner) return;

          const C = sharedBoundary?.corner ?? snap(rawCorner, findVertexReference(adjacentPoly, rawCorner) ?? rawCorner);
          console.log("cornerPick", {
            endKey,
            side,
            B,
            pickedCorner: C,
            adjacentFaceId: adjacentFace?.id,
            reusedAdjacentBoundary: Boolean(sharedBoundary),
          });

          const area = (C.x - B.x) * (E.z - B.z) - (C.z - B.z) * (E.x - B.x);
          console.log("Corner area", endKey, side, area);

          // Build an explicit triangle poly in arch space (closed)
          const triPoly: XZ[] = orientRoofFacePolygon([E, C, B]);

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

          if (geometry) {
            geometries.push(geometry);
            console.log("CORNER GEOMETRY ADDED", `corner-${ridge.id}-${endKey}-${side}`);
          }
        });
      });
    }
  }

  for (const ridge of roof.ridgeSegments) {
    const bases = hipBases.get(ridge.id);
    if (!bases?.start || !bases?.end) continue;

    const ridgeTopAbs = derivedRoof.baseLevel.elevation + ridge.height;
    const eaveTopAbs = derivedRoof.baseLevel.elevation + roof.eaveHeight;

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


function pointLiesOnSegment(point: XZ, start: XZ, end: XZ, eps = 1e-6): boolean {
  const segment = { x: end.x - start.x, z: end.z - start.z };
  const toPoint = { x: point.x - start.x, z: point.z - start.z };
  const cross = segment.x * toPoint.z - segment.z * toPoint.x;
  if (Math.abs(cross) > eps) return false;

  const dot = toPoint.x * segment.x + toPoint.z * segment.z;
  if (dot < -eps) return false;

  const lenSq = segment.x * segment.x + segment.z * segment.z;
  if (dot > lenSq + eps) return false;

  return true;
}

function segmentLiesOnFootprintBoundary(
  start: XZ,
  end: XZ,
  fpClosed: XZ[],
  eps = 1e-6
): boolean {
  const fp = ensureClosed(fpClosed);

  for (let i = 0; i < fp.length - 1; i++) {
    const boundaryStart = fp[i];
    const boundaryEnd = fp[i + 1];

    if (
      pointLiesOnSegment(start, boundaryStart, boundaryEnd, eps) &&
      pointLiesOnSegment(end, boundaryStart, boundaryEnd, eps)
    ) {
      return true;
    }
  }

  return false;
}

function findSharedCornerBoundaryFromAdjacentPatch(
  adjacentPolyClosed: XZ[],
  fpClosed: XZ[],
  basePoint: XZ,
  eps = 1e-6
): { base: XZ; corner: XZ } | null {
  const adjacentPoly = ensureClosed(adjacentPolyClosed);

  for (let i = 0; i < adjacentPoly.length - 1; i++) {
    const start = adjacentPoly[i];
    const end = adjacentPoly[i + 1];

    if (!pointLiesOnSegment(basePoint, start, end, eps)) continue;
    if (!segmentLiesOnFootprintBoundary(start, end, fpClosed, eps)) continue;

    if (sameXZ(start, basePoint, eps)) return { base: start, corner: end };
    if (sameXZ(end, basePoint, eps)) return { base: end, corner: start };
  }

  return null;
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function sameXZ(a: XZ, b: XZ, eps = 1e-6): boolean {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.z - b.z) < eps;
}

function logCornerDebug(
  ridgeId: string,
  endKey: "start" | "end",
  side: "left" | "right",
  E: XZ,
  B: XZ | null,
  candidates: XZ[],
  picked: XZ | null
) {
  console.group(`CORNER DEBUG → ridge:${ridgeId} end:${endKey} side:${side}`);
  console.log("ridgeId:", ridgeId);
  console.log("endKey:", endKey);
  console.log("side:", side);
  console.log("Ridge endpoint E:", E);
  console.log("Seam base B:", B);
  console.log("Candidate corners:", candidates);
  console.log("Picked corner C:", picked);
  console.groupEnd();
}

function pickCornerFromEdgeContainingBase(
  fpClosed: XZ[],
  B: XZ,
  ridge: { start: XZ; end: XZ },
  side: "left" | "right",
  eps = 1e-6
): { corner: XZ | null; candidates: XZ[] } {
  const fp = ensureClosed(fpClosed);
  const n = fp.length - 1; // closed polygon
  const desiredSideSign = side === "left" ? 1 : -1;

  const rankCandidate = (candidate: XZ) => {
    const sideScore = signedSide(candidate, ridge.start, ridge.end);
    const onRequestedSide = desiredSideSign * sideScore >= -eps;
    return {
      candidate,
      sideScore,
      onRequestedSide,
      requestAlignment: desiredSideSign * sideScore,
      distanceToBaseSq: (candidate.x - B.x) * (candidate.x - B.x) + (candidate.z - B.z) * (candidate.z - B.z),
    };
  };

  const chooseCorner = (candidates: XZ[]) => {
    if (candidates.length === 0) return null;

    const ranked = candidates.map(rankCandidate).sort((a, b) => {
      if (Number(b.onRequestedSide) !== Number(a.onRequestedSide)) {
        return Number(b.onRequestedSide) - Number(a.onRequestedSide);
      }

      if (Math.abs(b.requestAlignment - a.requestAlignment) > eps) {
        return b.requestAlignment - a.requestAlignment;
      }

      return a.distanceToBaseSq - b.distanceToBaseSq;
    });

    return ranked[0]?.candidate ?? null;
  };

  const dedupeCandidates = (candidates: XZ[]) => {
    const out: XZ[] = [];
    for (const candidate of candidates) {
      if (sameXZ(candidate, B, eps)) continue;
      if (!out.some((point) => sameXZ(point, candidate, eps))) out.push(candidate);
    }
    return out;
  };

  const vertexIndex = fp.slice(0, -1).findIndex((point) => sameXZ(point, B, eps));
  if (vertexIndex >= 0) {
    const prev = fp[(vertexIndex - 1 + n) % n];
    const next = fp[(vertexIndex + 1) % n];
    const candidates = dedupeCandidates([prev, next]);
    return { corner: chooseCorner(candidates), candidates };
  }

  for (let i = 0; i < n; i++) {
    const A = fp[i];
    const C = fp[i + 1];

    const AB = { x: B.x - A.x, z: B.z - A.z };
    const AC = { x: C.x - A.x, z: C.z - A.z };

    const cross = AB.x * AC.z - AB.z * AC.x;
    if (Math.abs(cross) > eps) continue;

    const dot = AB.x * AC.x + AB.z * AC.z;
    const lenSq = AC.x * AC.x + AC.z * AC.z;
    if (dot < -eps || dot > lenSq + eps) continue;

    const candidates = dedupeCandidates([A, C]);
    return { corner: chooseCorner(candidates), candidates };
  }

  return { corner: null, candidates: [] };
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

function distanceXZ(a: XZ, b: XZ): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function snap(p: XZ, target: XZ, eps = 1e-6): XZ {
  if (distanceXZ(p, target) < eps) return target;
  return p;
}

function findVertexReference(polyClosed: XZ[] | null | undefined, target: XZ, eps = 1e-6): XZ | null {
  if (!polyClosed) return null;

  for (const point of polyClosed.slice(0, -1)) {
    if (distanceXZ(point, target) < eps) return point;
  }

  return null;
}

function findAdjacentCornerFace(
  faces: MultiPlaneRoofSpec["faces"],
  ridgeId: string,
  endKey: "start" | "end",
  side: "left" | "right"
) {
  return (
    faces.find(
      (face) =>
        face.kind === "ridgeSideSegment" &&
        face.ridgeId === ridgeId &&
        face.side === side &&
        face.capEnd === endKey
    ) ?? null
  );
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
  derivedRoof: DerivedRoof,
  roof: MultiRidgeRoofSpec
): THREE.BufferGeometry[] {
  const ridge = roof.ridgeSegments[0];
  if (!ridge) return [];

  const thickness = roof.thickness ?? 0.2;

  const ridgeTopAbs = derivedRoof.baseLevel.elevation + ridge.height;
  const eaveTopAbs = derivedRoof.baseLevel.elevation + roof.eaveHeight;

  const fp = ensureClosed(derivedRoof.roofPolygonOuter);

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
    const orientedPos = orientRoofFacePolygon(pos);
    const posGeometry = buildRoofFaceGeometry({
      faceId: "multi-ridge-pos",
      polyClosed: orientedPos,
      triangles: triangulateXZ(orientedPos.map(archToWorldXZ)),
      thickness,
      heightAtOuter: roofOuterAt,
    });

    if (posGeometry) out.push(posGeometry);
  }
  if (neg.length >= 4) {
    const orientedNeg = orientRoofFacePolygon(neg);
    const negGeometry = buildRoofFaceGeometry({
      faceId: "multi-ridge-neg",
      polyClosed: orientedNeg,
      triangles: triangulateXZ(orientedNeg.map(archToWorldXZ)),
      thickness,
      heightAtOuter: roofOuterAt,
    });

    if (negGeometry) out.push(negGeometry);
  }

  return out;
}

export function buildStructuralGableGeometry(
  derivedRoof: DerivedRoof,
  roof: StructuralRoofSpec
): THREE.BufferGeometry {
  const thickness = roof.thickness ?? 0.2;
  const eaveTopAbs = derivedRoof.baseLevel.elevation + roof.eaveHeight;

  const ridge: RidgeLine =
    roof.type === "multi-ridge"
      ? roof.ridgeSegments[0]
      : {
          start: roof.ridge.start,
          end: roof.ridge.end,
          height: roof.ridgeHeight,
        };
  const ridgeTopAbs = derivedRoof.baseLevel.elevation + ridge.height;

  const fpClosed = ensureClosed(derivedRoof.roofPolygonOuter);
  const fp = fpClosed.slice(0, -1);

  const { roofOuterAt, roofBottomAt } = getRoofHeightFunctions(
    fpClosed,
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
