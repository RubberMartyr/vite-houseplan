import * as THREE from 'three';
import type { ArchitecturalHouse } from '../architecturalTypes';
import { deriveRoofPlan } from './deriveRoofPlan';
import { deriveSeamBases } from './deriveSeamBases';
import { deriveHipCapRegions } from './deriveHipCapRegions';
import { deriveRidgeSideRegions } from './deriveRidgeSideRegions';
export type LegacyRoofAdapterOutput = {
    meshes: Array<{
        geometry: THREE.BufferGeometry;
        position: [number, number, number];
        rotation: [number, number, number];
    }>;
    plans: ReturnType<typeof deriveRoofPlan>[];
    seamBases: ReturnType<typeof deriveSeamBases>;
    regions: Array<ReturnType<typeof deriveHipCapRegions>[number] | ReturnType<typeof deriveRidgeSideRegions>[number]>;
};
export declare function buildRoofLegacyAdapter(house: ArchitecturalHouse): LegacyRoofAdapterOutput;
