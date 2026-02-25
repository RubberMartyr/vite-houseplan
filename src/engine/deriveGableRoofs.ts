import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import type { LevelSpec, RoofSpec, Vec2 } from "./types";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
import { archArrayToWorld, archToWorldXZ } from "./spaceMapping";

type GableRoofSpec = Extract<RoofSpec, { type: "gable" }>;
type MultiRidgeRoofSpec = Extract<RoofSpec, { type: "multi-ridge" }>;
type StructuralRoofSpec = GableRoofSpec | MultiRidgeRoofSpec;
type RidgeLine = {
  start: Vec2;
  end: Vec2;
  height: number;
};

// Helper: convert Vec2[] -> arrays for triangulation
function toTHREEVec2(points: { x: number; z: number }[]) {
  return points.map((p) => new THREE.Vector2(p.x, p.z));
}

function ensureClosed(points: Vec2[]): Vec2[] {
  if (points.length === 0) return points;

  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.z === last.z) return points;

  return [...points, first];
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

function getRoofHeightFunctions(
  fp: Vec2[],
  ridge: RidgeLine,
  ridgeTopAbs: number,
  eaveTopAbs: number,
  thickness: number
) {
  const fpClosed = ensureClosed(fp);

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

  function roofOuterAt(px: number, pz: number) {
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

  const { roofOuterAt } = getRoofHeightFunctions(
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
    const yBot = yTop - thickness;

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

  return [geom];
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
