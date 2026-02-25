import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";
import { archArrayToWorld, archToWorldXZ } from "./spaceMapping";

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

    const slopeRad = (roof.slopeDeg * Math.PI) / 180;
    const thickness = roof.thickness ?? 0.2;
    const baseY = baseLevel.elevation + baseLevel.height;

    // Footprint with optional overhang (negative = outward)
    let fp = baseLevel.footprint.outer;
    if (roof.overhang && roof.overhang !== 0) {
      fp = offsetPolygonInward(fp, -roof.overhang);
    }

    // Triangulate footprint (top surface in XZ)
    const contour = toTHREEVec2(archArrayToWorld(fp));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

    // Compute ridge center and half-span along slope axis (in mapped Z space)
    const { minX, maxX, minZ, maxZ } = bbox(fp);

    const ridgeDir = roof.ridgeDirection; // "x" or "z"
    const ridgeCenterX = (minX + maxX) / 2;
    const ridgeCenterZ = (minZ + maxZ) / 2;

    const span = ridgeDir === "x" ? maxZ - minZ : maxX - minX;
    const halfSpan = span / 2;

    function roofHeightAt(x: number, zMapped: number) {
      const d =
        ridgeDir === "x"
          ? Math.abs(zMapped - ridgeCenterZ)
          : Math.abs(x - ridgeCenterX);
      const h = Math.tan(slopeRad) * (halfSpan - d);
      return Math.max(0, h);
    }

    // Build vertex arrays for top and bottom
    const topVerts: number[] = [];
    const botVerts: number[] = [];

    for (const p of fp) {
      const wp = archToWorldXZ(p);
      const h = roofHeightAt(wp.x, wp.z);
      const yTop = baseY + h;
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

    geometries.push(geom);
  }

  return geometries;
}
