import * as THREE from 'three';
import type { DerivedWallSegment } from './deriveWalls';
import { archToWorldXZ } from './spaceMapping';

export function extrudeWallSegment(seg: DerivedWallSegment): THREE.BufferGeometry {
  const ws = archToWorldXZ(seg.start);
  const we = archToWorldXZ(seg.end);
  const dx = we.x - ws.x;
  const dz = we.z - ws.z;
  const length = Math.hypot(dx, dz);

  if (length === 0) {
    return new THREE.BufferGeometry();
  }

  const px = (-dz / length) * seg.outwardSign;
  const pz = (dx / length) * seg.outwardSign;
  const halfThickness = seg.thickness / 2;
  const yBottom = seg.start.y;
  const yTop = seg.start.y + seg.height;

  const s1x = ws.x + px * halfThickness;
  const s1z = ws.z + pz * halfThickness;
  const s2x = ws.x - px * halfThickness;
  const s2z = ws.z - pz * halfThickness;
  const e1x = we.x + px * halfThickness;
  const e1z = we.z + pz * halfThickness;
  const e2x = we.x - px * halfThickness;
  const e2z = we.z - pz * halfThickness;

  const positions = new Float32Array([
    s1x, yBottom, s1z,
    s2x, yBottom, s2z,
    e1x, yBottom, e1z,
    e2x, yBottom, e2z,
    s1x, yTop, s1z,
    s2x, yTop, s2z,
    e1x, yTop, e1z,
    e2x, yTop, e2z,
  ]);

  const brickScale = 0.6;
  const tangentXZ = { x: dx / length, z: dz / length };
  const uv = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const relx = x - ws.x;
    const relz = z - ws.z;

    const u = (relx * tangentXZ.x + relz * tangentXZ.z) * brickScale;
    const v = (y - yBottom) * brickScale;

    uv.push(u, v);
  }

  const indices = [
    0, 2, 1,
    1, 2, 3,

    4, 5, 6,
    5, 7, 6,

    0, 1, 4,
    1, 5, 4,

    2, 6, 3,
    3, 6, 7,

    1, 3, 5,
    3, 7, 5,

    0, 4, 2,
    2, 4, 6,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  // Recompute normals after setting wall attributes to reduce panel seam lighting.
  geometry.computeVertexNormals();

  return geometry;
}
