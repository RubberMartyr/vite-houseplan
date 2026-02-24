import * as THREE from 'three';
import type { DerivedWallSegment } from './deriveWalls';

export function extrudeWallSegment(seg: DerivedWallSegment): THREE.BufferGeometry {
  const dx = seg.end.x - seg.start.x;
  const dz = seg.end.z - seg.start.z;
  const length = Math.hypot(dx, dz);

  if (length === 0) {
    return new THREE.BufferGeometry();
  }

  const px = -dz / length;
  const pz = dx / length;
  const halfThickness = seg.thickness / 2;
  const yBottom = seg.start.y;
  const yTop = seg.start.y + seg.height;

  const s1x = seg.start.x + px * halfThickness;
  const s1z = seg.start.z + pz * halfThickness;
  const s2x = seg.start.x - px * halfThickness;
  const s2z = seg.start.z - pz * halfThickness;
  const e1x = seg.end.x + px * halfThickness;
  const e1z = seg.end.z + pz * halfThickness;
  const e2x = seg.end.x - px * halfThickness;
  const e2z = seg.end.z - pz * halfThickness;

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
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
