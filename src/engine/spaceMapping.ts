import * as THREE from "three";

export type ArchPoint = { x: number; z: number };

/**
 * Architectural → Three.js world mapping.
 * Centralized structural Z inversion.
 */
export function archToWorldXZ(p: ArchPoint): ArchPoint {
  return {
    x: p.x,
    z: -p.z,
  };
}

export function archToWorldVec3(
  x: number,
  y: number,
  z: number
): THREE.Vector3 {
  return new THREE.Vector3(x, y, -z);
}

export function archArrayToWorld(points: ArchPoint[]): ArchPoint[] {
  return points.map(archToWorldXZ);
}
