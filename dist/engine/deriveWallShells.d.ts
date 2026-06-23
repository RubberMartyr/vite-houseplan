import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
export type DerivedWallShell = {
    id: string;
    levelId: string;
    geometry: THREE.BufferGeometry;
};
export declare function deriveWallShellsFromLevels(arch: ArchitecturalHouse): DerivedWallShell[];
