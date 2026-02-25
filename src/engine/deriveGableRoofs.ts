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

function distanceToSegment(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
) {
  const A = px - x1;
  const B = pz - z1;
  const C = x2 - x1;
  const D = z2 - z1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  const param = lenSq !== 0 ? dot / lenSq : 0;

  const t = Math.max(0, Math.min(1, param));

  const closestX = x1 + t * C;
  const closestZ = z1 + t * D;

  const dx = px - closestX;
  const dz = pz - closestZ;

  return Math.sqrt(dx * dx + dz * dz);
}

function signedSide(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
) {
  return (pz - z1) * (x2 - x1) - (px - x1) * (z2 - z1);
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
  console.log("ridge:", roof.ridgeSegments[0]);
  console.log("footprint points:", baseLevel.footprint.outer.length);
  const ridge = roof.ridgeSegments[0];

  let originalFp = baseLevel.footprint.outer;

  // Ensure explicitly closed polygon
  if (
    originalFp.length > 0 &&
    (originalFp[0].x !== originalFp[originalFp.length - 1].x ||
      originalFp[0].z !== originalFp[originalFp.length - 1].z)
  ) {
    originalFp = [...originalFp, { ...originalFp[0] }];
  }

  const eaveAbs = baseLevel.elevation + roof.eaveHeight;
  const ridgeAbs = baseLevel.elevation + ridge.height;

  const leftDistances: number[] = [];
  const rightDistances: number[] = [];

  for (const p of originalFp) {
    const side = signedSide(
      p.x,
      p.z,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

    const d = distanceToSegment(
      p.x,
      p.z,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

    if (side >= 0) {
      leftDistances.push(d);
    } else {
      rightDistances.push(d);
    }
  }

  const leftSpan = leftDistances.length > 0 ? Math.max(...leftDistances) : 0;
  const rightSpan = rightDistances.length > 0 ? Math.max(...rightDistances) : 0;

  function roofHeightAt(px: number, pz: number) {
    const side = signedSide(
      px,
      pz,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

    const d = distanceToSegment(
      px,
      pz,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

    const span = side >= 0 ? leftSpan : rightSpan;

    if (span === 0) return eaveAbs;

    const t = 1 - d / span;
    const clamped = Math.max(0, Math.min(1, t));

    return eaveAbs + clamped * (ridgeAbs - eaveAbs);
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

    const yBot = roofHeightAt(p.x, p.z);
    const yTop = yBot + (roof.thickness ?? 0.2);

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

  console.log("geom vertex count:", topVerts.length);

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

  function distanceToSegment(
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ) {
    const A = px - x1;
    const B = pz - z1;
    const C = x2 - x1;
    const D = z2 - z1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq > 0 ? dot / lenSq : 0;
    const t = Math.max(0, Math.min(1, param));

    const closestX = x1 + t * C;
    const closestZ = z1 + t * D;

    const dx = px - closestX;
    const dz = pz - closestZ;

    return Math.sqrt(dx * dx + dz * dz);
  }

  const span = Math.max(
    ...originalFp.map((p) =>
      distanceToSegment(
        p.x,
        p.z,
        ridge.start.x,
        ridge.start.z,
        ridge.end.x,
        ridge.end.z
      )
    )
  );

  function roofHeightAt(px: number, pz: number) {
    if (span <= 0) return eaveAbs;

    const d = distanceToSegment(
      px,
      pz,
      ridge.start.x,
      ridge.start.z,
      ridge.end.x,
      ridge.end.z
    );

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
