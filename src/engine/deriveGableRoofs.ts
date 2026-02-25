import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import type { LevelSpec, RoofSpec } from "./types";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
import { archArrayToWorld, archToWorldXZ } from "./spaceMapping";

type GableRoofSpec = Extract<RoofSpec, { type: "gable" }>;
type MultiRidgeRoofSpec = Extract<RoofSpec, { type: "multi-ridge" }>;
type StructuralRoofSpec = GableRoofSpec | MultiRidgeRoofSpec;

// Helper: convert Vec2[] -> arrays for triangulation
function toTHREEVec2(points: { x: number; z: number }[]) {
  return points.map((p) => new THREE.Vector2(p.x, p.z));
}

export function deriveGableRoofGeometries(
  arch: ArchitecturalHouse
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs ?? []) {
    if (roof.type !== "gable" && roof.type !== "multi-ridge") continue;

    if (roof.type === "gable") {
      const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
      if (!baseLevel) continue;

      const geom = buildStructuralGableGeometry(baseLevel, roof);
      geometries.push(geom);
    }

    if (roof.type === "multi-ridge") {
      const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
      if (!baseLevel) continue;

      const geoms = buildMultiRidgeRoof(baseLevel, roof);
      geometries.push(...geoms);
    }
  }

  return geometries;
}

function buildMultiRidgeRoof(
  baseLevel: LevelSpec,
  roof: MultiRidgeRoofSpec
): THREE.BufferGeometry[] {
  type XZ = { x: number; z: number };

  function ensureClosed(poly: XZ[]): XZ[] {
    if (poly.length < 3) return poly;

    const a = poly[0];
    const b = poly[poly.length - 1];
    if (a.x === b.x && a.z === b.z) return poly;

    return [...poly, { ...a }];
  }

  function intersectSegmentWithVerticalX(a: XZ, b: XZ, xCut: number): XZ | null {
    const dx = b.x - a.x;
    if (Math.abs(dx) < 1e-9) return null;

    const t = (xCut - a.x) / dx;
    if (t < 0 || t > 1) return null;

    return {
      x: xCut,
      z: a.z + t * (b.z - a.z),
    };
  }

  function clipPolyByVerticalX(poly: XZ[], xCut: number, keep: "left" | "right"): XZ[] {
    const inside = (p: XZ) =>
      keep === "left" ? p.x <= xCut + 1e-9 : p.x >= xCut - 1e-9;

    const out: XZ[] = [];
    const closed = ensureClosed(poly);

    for (let i = 0; i < closed.length - 1; i++) {
      const A = closed[i];
      const B = closed[i + 1];

      const Ain = inside(A);
      const Bin = inside(B);

      if (Ain && Bin) {
        out.push(B);
      } else if (Ain && !Bin) {
        const I = intersectSegmentWithVerticalX(A, B, xCut);
        if (I) out.push(I);
      } else if (!Ain && Bin) {
        const I = intersectSegmentWithVerticalX(A, B, xCut);
        if (I) out.push(I);
        out.push(B);
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
      if (first.x !== last.x || first.z !== last.z) {
        cleaned.push({ ...first });
      }
    }

    return cleaned;
  }

  function splitPolygonByRidgeX(poly: XZ[], ridgeX: number): { left: XZ[]; right: XZ[] } {
    const left = clipPolyByVerticalX(poly, ridgeX, "left");
    const right = clipPolyByVerticalX(poly, ridgeX, "right");
    return { left, right };
  }

  function triangulateXZ(polyClosed: XZ[]): number[][] {
    const contour = polyClosed
      .slice(0, -1)
      .map((p) => new THREE.Vector2(p.x, p.z));
    return THREE.ShapeUtils.triangulateShape(contour, []);
  }

  function buildRoofGeomFromPolyHalf(params: {
    polyClosed: XZ[];
    triangles: number[][];
    thickness: number;
    yBotAtX: (x: number) => number;
  }): THREE.BufferGeometry {
    const { polyClosed, triangles, thickness, yBotAtX } = params;

    const poly = polyClosed.slice(0, -1);
    const topVerts: number[] = [];
    const botVerts: number[] = [];

    for (const p of poly) {
      const wp = archToWorldXZ(p);
      const yBot = yBotAtX(p.x);
      const yTop = yBot + thickness;

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

  const ridge = roof.ridgeSegments[0];
  const ridgeX = ridge.start.x;

  const thickness = roof.thickness ?? 0.2;
  const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;
  const ridgeTopAbs = baseLevel.elevation + ridge.height;
  const eaveBottomAbs = eaveTopAbs - thickness;
  const ridgeBottomAbs = ridgeTopAbs - thickness;

  const fpStruct = ensureClosed(baseLevel.footprint.outer);
  const xs = fpStruct.slice(0, -1).map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  const leftSpan = ridgeX - minX;
  const rightSpan = maxX - ridgeX;
  const slopeLeft = leftSpan === 0 ? 0 : (ridgeBottomAbs - eaveBottomAbs) / leftSpan;
  const slopeRight = rightSpan === 0 ? 0 : (ridgeBottomAbs - eaveBottomAbs) / rightSpan;

  function yBotAtX(x: number) {
    if (x <= ridgeX) return ridgeBottomAbs - slopeLeft * (ridgeX - x);
    return ridgeBottomAbs - slopeRight * (x - ridgeX);
  }

  let fp = baseLevel.footprint.outer;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }
  fp = ensureClosed(fp);

  const { left, right } = splitPolygonByRidgeX(fp, ridgeX);

  const result: THREE.BufferGeometry[] = [];
  if (left.length >= 4) {
    const trisLeft = triangulateXZ(left);
    result.push(
      buildRoofGeomFromPolyHalf({
        polyClosed: left,
        triangles: trisLeft,
        thickness,
        yBotAtX,
      })
    );
  }

  if (right.length >= 4) {
    const trisRight = triangulateXZ(right);
    result.push(
      buildRoofGeomFromPolyHalf({
        polyClosed: right,
        triangles: trisRight,
        thickness,
        yBotAtX,
      })
    );
  }

  return result;
}

export function buildStructuralGableGeometry(
  baseLevel: LevelSpec,
  roof: StructuralRoofSpec
): THREE.BufferGeometry {
  const thickness = roof.thickness ?? 0.2;
  const eaveAbs = baseLevel.elevation + roof.eaveHeight;

  const ridge =
    roof.type === "multi-ridge"
      ? roof.ridgeSegments[0]
      : {
          start: roof.ridge.start,
          end: roof.ridge.end,
          height: roof.ridgeHeight,
        };
  const ridgeAbs = baseLevel.elevation + ridge.height;

  const originalFp = baseLevel.footprint.outer;

  // Footprint with optional overhang (negative = outward)
  let fp = originalFp;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }

  // Triangulate footprint (top surface in XZ)
  const contour = toTHREEVec2(archArrayToWorld(fp));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

  function distanceToRidge(px: number, pz: number) {
    const A = ridge.end.z - ridge.start.z;
    const B = ridge.start.x - ridge.end.x;
    const C = ridge.end.x * ridge.start.z - ridge.start.x * ridge.end.z;

    return Math.abs(A * px + B * pz + C) / Math.sqrt(A * A + B * B);
  }

  const span = Math.max(...originalFp.map((p) => distanceToRidge(p.x, p.z)));

  function roofHeightAt(px: number, pz: number) {
    if (span <= 0) return eaveAbs;

    const d = distanceToRidge(px, pz);

    const t = 1 - d / span;
    const clamped = Math.max(0, Math.min(1, t));

    return eaveAbs + clamped * (ridgeAbs - eaveAbs);
  }

  // Build vertex arrays for top and bottom
  const topVerts: number[] = [];
  const botVerts: number[] = [];

  for (const p of fp) {
    const wp = archToWorldXZ(p);
    const yTop = roofHeightAt(p.x, p.z);
    const yBot = yTop - thickness;

    topVerts.push(wp.x, yTop, wp.z);
    botVerts.push(wp.x, yBot, wp.z);
  }

  // Indices for top and bottom surfaces
  const indices: number[] = [];

  for (const tri of triangles) {
    indices.push(tri[0], tri[1], tri[2]);
  }

  const bottomOffset = fp.length;
  for (const tri of triangles) {
    indices.push(bottomOffset + tri[2], bottomOffset + tri[1], bottomOffset + tri[0]);
  }

  // Side faces
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
