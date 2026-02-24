import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";

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
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  return { minX, maxX, minZ, maxZ };
}

export function deriveGableRoofGeometries(
  arch: ArchitecturalHouse
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs) {
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
    const contour = toTHREEVec2(fp);
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

    // Compute ridge center and half-span along slope axis
    const { minX, maxX, minZ, maxZ } = bbox(fp);

    const ridgeDir = roof.ridgeDirection; // "x" or "z"
    const ridgeCenterX = (minX + maxX) / 2;
    const ridgeCenterZ = (minZ + maxZ) / 2;

    const span = ridgeDir === "x" ? maxZ - minZ : maxX - minX;
    const halfSpan = span / 2;

    // Height at a point based on distance to ridge line
    // ridgeDirection="x" => slope varies by z distance
    // ridgeDirection="z" => slope varies by x distance
    function roofHeightAt(x: number, z: number) {
      const d =
        ridgeDir === "x"
          ? Math.abs(z - ridgeCenterZ)
          : Math.abs(x - ridgeCenterX);
      const h = Math.tan(slopeRad) * (halfSpan - d);
      return Math.max(0, h);
    }

    // Build vertex arrays for top and bottom
    const topVerts: number[] = [];
    const botVerts: number[] = [];

    for (const p of fp) {
      const h = roofHeightAt(p.x, p.z);
      const yTop = baseY + h;
      const yBot = yTop - thickness;

      topVerts.push(p.x, yTop, p.z);
      botVerts.push(p.x, yBot, p.z);
    }

    // Indices for top and bottom surfaces
    const indices: number[] = [];

    // Top faces (as triangulated)
    for (const tri of triangles) {
      indices.push(tri[0], tri[1], tri[2]);
    }

    // Bottom faces (reverse winding)
    const bottomOffset = fp.length;
    for (const tri of triangles) {
      indices.push(bottomOffset + tri[2], bottomOffset + tri[1], bottomOffset + tri[0]);
    }

    // Side faces around perimeter: stitch i -> i+1
    const n = fp.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;

      const ti = i;
      const tj = j;
      const bi = bottomOffset + i;
      const bj = bottomOffset + j;

      // Two triangles for quad (ti,tj,bj) and (ti,bj,bi)
      indices.push(ti, tj, bj);
      indices.push(ti, bj, bi);
    }

    // Combine vertices: top then bottom
    const positions = new Float32Array([...topVerts, ...botVerts]);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    geometries.push(geom);
  }

  return geometries;
}
