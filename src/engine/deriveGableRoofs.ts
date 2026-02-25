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
      console.log("building multi-ridge roof");
      const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
      if (!baseLevel) continue;

      const geom = buildMultiRidgeRoof(baseLevel, roof);
      geometries.push(geom);
    }
  }

  return geometries;
}

function buildMultiRidgeRoof(
  baseLevel: LevelSpec,
  roof: MultiRidgeRoofSpec
): THREE.BufferGeometry {
  const ridge = roof.ridgeSegments[0];
  const ridgeX = ridge.start.x;
  const originalFp = baseLevel.footprint.outer;
  const minX = Math.min(...originalFp.map((p) => p.x));
  const maxX = Math.max(...originalFp.map((p) => p.x));

  const thickness = roof.thickness ?? 0.2;
  const eaveTopAbs = baseLevel.elevation + roof.eaveHeight;
  const ridgeTopAbs = baseLevel.elevation + ridge.height;
  const eaveBottomAbs = eaveTopAbs - thickness;
  const ridgeBottomAbs = ridgeTopAbs - thickness;

  const leftSpan = ridgeX - minX;
  const rightSpan = maxX - ridgeX;
  const slopeLeft =
    leftSpan === 0 ? 0 : (ridgeBottomAbs - eaveBottomAbs) / leftSpan;
  const slopeRight =
    rightSpan === 0 ? 0 : (ridgeBottomAbs - eaveBottomAbs) / rightSpan;

  function roofBottomAt(px: number) {
    if (px <= ridgeX) {
      return ridgeBottomAbs - slopeLeft * (ridgeX - px);
    }

    return ridgeBottomAbs - slopeRight * (px - ridgeX);
  }

  let fp = originalFp;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }

  const contour = toTHREEVec2(archArrayToWorld(fp));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

  const topVerts: number[] = [];
  const botVerts: number[] = [];

  for (const p of fp) {
    const wp = archToWorldXZ(p);

    const yBot = roofBottomAt(p.x);
    const yTop = yBot + thickness;

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
