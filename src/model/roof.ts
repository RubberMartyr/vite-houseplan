import * as THREE from 'three';
import { buildRoofFromCurrentSystem } from '../engine/buildRoof';

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
} {
  return buildRoofFromCurrentSystem();
}
