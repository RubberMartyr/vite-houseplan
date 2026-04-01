import * as THREE from 'three';

export type ArchXZ = { x: number; z: number };
export type WorldXZ = { x: number; z: number };

export function archToWorldXZ(p: ArchXZ): WorldXZ {
  return {
    x: p.x,
    z: -p.z,
  };
}

export function archToWorldVec3(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, -z);
}

export function archPointToWorldVec3(p: { x: number; y: number; z: number }) {
  return new THREE.Vector3(p.x, p.y, -p.z);
}

export function archArrayToWorld(points: ArchXZ[]) {
  return points.map(archToWorldXZ);
}
