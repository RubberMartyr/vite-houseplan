import * as THREE from 'three';
import { buildRoofLegacyAdapter } from '../engine/roof/buildRoofLegacyAdapter';
import type { ArchitecturalHouse } from '../engine/architecturalTypes';

export function buildRoofMeshes(house: ArchitecturalHouse): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
} {
  const { meshes } = buildRoofLegacyAdapter(house);
  return { meshes };
}
