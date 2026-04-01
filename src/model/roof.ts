import * as THREE from 'three';
import { buildRoofLegacyAdapter } from '../engine/roof/buildRoofLegacyAdapter';

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
} {
  const { meshes } = buildRoofLegacyAdapter();
  return { meshes };
}
