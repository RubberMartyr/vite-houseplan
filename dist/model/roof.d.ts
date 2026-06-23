import * as THREE from 'three';
import type { ArchitecturalHouse } from '../engine/architecturalTypes';
export declare function buildRoofMeshes(house: ArchitecturalHouse): {
    meshes: Array<{
        geometry: THREE.BufferGeometry;
        position: [number, number, number];
        rotation: [number, number, number];
    }>;
};
