import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import type {
  HalfPlane,
  LevelSpec,
  MultiPlaneRoofSpec,
  RoofSpec,
  Vec2,
  XZ,
} from "./types";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
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

function buildRoofFaceGeometry(params: {
  polyClosed: XZ[];
  triangles: number[][];
  thickness: number;
  heightAtOuter: (x: number, z: number) => number;
}): THREE.BufferGeometry {
  const { polyClosed, triangles, thickness, heightAtOuter } = params;
  const poly = polyClosed.slice(0, -1);

  const topVerts: number[] = [];
  const botVerts: number[] = [];

  for (const p of poly) {
    const wp = archToWorldXZ(p);

    const yTop = heightAtOuter(p.x, p.z);
    const yBot = yTop - thickness;

    topVerts.push(wp.x, yTop, wp.z);
    botVerts.push(wp.x, yBot, wp.z);
  }

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
  arch: ArchitecturalHouse
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
      const geoms = deriveMultiPlaneRoofGeometries(arch, roof);
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

  for (const face of roof.faces) {
    const regionPoly = clipPolyByRegion(fp, face.region);
    if (regionPoly.length < 4) continue;

    let plane: { heightAt(x: number, z: number): number } | null = null;

    if (face.kind === "hipCap") {
      if (!face.p1 || !face.p2 || !face.p3) continue;

      plane = planeFrom3Points(
        { x: face.p1.x, z: face.p1.z, y: baseLevel.elevation + face.p1.h },
        { x: face.p2.x, z: face.p2.z, y: baseLevel.elevation + face.p2.h },
        { x: face.p3.x, z: face.p3.z, y: baseLevel.elevation + face.p3.h }
      );
    } else if (face.kind === "ridgeSide") {
      if (!face.ridgeId) continue;

      const ridge = roof.ridgeSegments.find((r) => r.id === face.ridgeId);
      if (!ridge) continue;

      const ridgeTopAbs = baseLevel.elevation + ridge.height;
      const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;

      const a = ridge.start;
      const b = ridge.end;

      const eaveAnchor = pickFarthestPoint(regionPoly, a, b);
      if (!eaveAnchor) continue;

      plane = planeFrom3Points(
        { x: a.x, z: a.z, y: ridgeTopAbs },
        { x: b.x, z: b.z, y: ridgeTopAbs },
        { x: eaveAnchor.x, z: eaveAnchor.z, y: eaveTopAbs }
      );
    } else {
      continue;
    }

    if (!plane) continue;

    const triangles = triangulateXZ(regionPoly);
    geometries.push(
      buildRoofFaceGeometry({
        polyClosed: regionPoly,
        triangles,
        thickness,
        heightAtOuter: (x, z) => plane.heightAt(x, z),
      })
    );
  }

  return geometries;
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
) {
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

  const d = -(nx * p1.x + ny * p1.y + nz * p1.z);

  return {
    heightAt(x: number, z: number) {
      if (Math.abs(ny) < 1e-9) return Number.NaN;
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
  const fpClosed = ensureClosed(fp);
  const hipPlanes: ((x: number, z: number) => number)[] = [];

  if (ridge.hipStart) {
    const hits = intersectPolygonWithHorizontalLine(fpClosed, ridge.start.z);

    if (hits.length === 2) {
      const left = hits[0].x < hits[1].x ? hits[0] : hits[1];
      const right = hits[0].x < hits[1].x ? hits[1] : hits[0];

      const plane = planeFrom3Points(
        { x: ridge.start.x, z: ridge.start.z, y: ridgeTopAbs },
        { x: left.x, z: left.z, y: eaveTopAbs },
        { x: right.x, z: right.z, y: eaveTopAbs }
      );

      hipPlanes.push((x, z) => plane.heightAt(x, z));
    }
  }

  if (ridge.hipEnd) {
    const hits = intersectPolygonWithHorizontalLine(fpClosed, ridge.end.z);

    if (hits.length === 2) {
      const left = hits[0].x < hits[1].x ? hits[0] : hits[1];
      const right = hits[0].x < hits[1].x ? hits[1] : hits[0];

      const plane = planeFrom3Points(
        { x: ridge.end.x, z: ridge.end.z, y: ridgeTopAbs },
        { x: left.x, z: left.z, y: eaveTopAbs },
        { x: right.x, z: right.z, y: eaveTopAbs }
      );

      hipPlanes.push((x, z) => plane.heightAt(x, z));
    }
  }

  let maxRun = 0;

  for (const p of fpClosed) {
    const sd = signedPerpDistanceToInfiniteLineXZ(
      p.x,
      p.z,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

    maxRun = Math.max(maxRun, Math.abs(sd));
  }

  const deltaH = ridgeTopAbs - eaveTopAbs;
  const k = maxRun === 0 ? 0 : deltaH / maxRun;

  function ridgePlaneHeight(px: number, pz: number) {
    const sd = signedPerpDistanceToInfiniteLineXZ(
      px,
      pz,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
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
    out.push(
      buildRoofFaceGeometry({
        polyClosed: pos,
        triangles: triangulateXZ(pos),
        thickness,
        heightAtOuter: roofOuterAt,
      })
    );
  }
  if (neg.length >= 4) {
    out.push(
      buildRoofFaceGeometry({
        polyClosed: neg,
        triangles: triangulateXZ(neg),
        thickness,
        heightAtOuter: roofOuterAt,
      })
    );
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
    const yTop = roofOuterAt(p.x, p.z);
    const yBot = roofBottomAt(p.x, p.z);

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
