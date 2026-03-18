import * as THREE from "three";
import type { DerivedWallSegment } from "./deriveWalls";
import { getWallVisibleBaseY, getWallVisibleTopY } from "./deriveWalls";
import { archToWorldXZ } from "./spaceMapping";

export function extrudeWallSegment(seg: DerivedWallSegment, brickScale = 0.6): THREE.BufferGeometry {
  const ws = archToWorldXZ(seg.start);
  const we = archToWorldXZ(seg.end);

  const dx = we.x - ws.x;
  const dz = we.z - ws.z;
  const length = Math.hypot(dx, dz);

  if (length === 0) {
    return new THREE.BufferGeometry();
  }

  const yBottom = getWallVisibleBaseY(seg);
  const yTop = getWallVisibleTopY(seg);

  // ---- vertices (single wall surface) ----

  const positions = new Float32Array([
    ws.x,
    yBottom,
    ws.z, // 0
    we.x,
    yBottom,
    we.z, // 1
    ws.x,
    yTop,
    ws.z, // 2
    we.x,
    yTop,
    we.z, // 3
  ]);

  // ---- UV mapping ----

  const uv: number[] = [];
  const dirx = dx / length;
  const dirz = dz / length;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const u = (x * dirx + z * dirz) * brickScale;
    const v = (y - yBottom) * brickScale;

    uv.push(u, v);
  }

  // ---- two triangles ----

  const indices = [0, 2, 1, 1, 2, 3];

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));

  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  return geometry;
}
