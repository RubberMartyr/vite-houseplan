import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import type { LevelSpec, RoofSpec } from "./types";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
import { archArrayToWorld, archToWorldXZ } from "./spaceMapping";

type GableRoofSpec = Extract<RoofSpec, { type: "gable" }>;

// Helper: convert Vec2[] -> arrays for triangulation
function toTHREEVec2(points: { x: number; z: number }[]) {
  return points.map((p) => new THREE.Vector2(p.x, p.z));
}

function bbox(points: { x: number; z: number }[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;

  for (const p of points) {
    const wp = archToWorldXZ(p);
    minX = Math.min(minX, wp.x);
    maxX = Math.max(maxX, wp.x);
    minZ = Math.min(minZ, wp.z);
    maxZ = Math.max(maxZ, wp.z);
  }
  return { minX, maxX, minZ, maxZ };
}

export function deriveGableRoofGeometries(
  arch: ArchitecturalHouse
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs ?? []) {
    if (roof.type !== "gable") continue;

    const baseLevel = arch.levels.find((l) => l.id === roof.baseLevelId);
    if (!baseLevel) continue;

    const geom = buildStructuralGableGeometry(baseLevel, roof);
    geometries.push(geom);
  }

  return geometries;
}

export function buildStructuralGableGeometry(
  baseLevel: LevelSpec,
  roof: GableRoofSpec
): THREE.BufferGeometry {
  const thickness = roof.thickness ?? 0.2;
  const eaveAbs = baseLevel.elevation + roof.eaveHeight;
  const ridgeAbs = baseLevel.elevation + roof.ridgeHeight;

  const originalFp = baseLevel.footprint.outer;

  // Footprint with optional overhang (negative = outward)
  let fp = originalFp;
  if (roof.overhang && roof.overhang !== 0) {
    fp = offsetPolygonInward(fp, -roof.overhang);
  }

  // Triangulate footprint (top surface in XZ)
  const contour = toTHREEVec2(archArrayToWorld(fp));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

  // Compute ridge center and half-span from the structural span
  const { minX, maxX, minZ, maxZ } = bbox(originalFp);

  const ridgeCenterX = (minX + maxX) / 2;
  const ridgeCenterZ = (minZ + maxZ) / 2;
  const span = roof.ridgeDirection === "x" ? maxZ - minZ : maxX - minX;
  const halfSpan = span / 2;

  function roofHeightAt(x: number, z: number) {
    if (halfSpan <= 0) return eaveAbs;

    const d =
      roof.ridgeDirection === "x"
        ? Math.abs(z - ridgeCenterZ)
        : Math.abs(x - ridgeCenterX);
    const t = 1 - d / halfSpan;
    const clamped = Math.max(0, Math.min(1, t));

    return eaveAbs + clamped * (ridgeAbs - eaveAbs);
  }

  // Build vertex arrays for top and bottom
  const topVerts: number[] = [];
  const botVerts: number[] = [];

  for (const p of fp) {
    const wp = archToWorldXZ(p);
    const yTop = roofHeightAt(wp.x, wp.z);
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
