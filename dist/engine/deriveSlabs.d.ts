import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
export type DerivedSlab = {
    id: string;
    geometry: THREE.BufferGeometry;
};
export declare function deriveSlabsFromLevels(arch: ArchitecturalHouse): DerivedSlab[];
