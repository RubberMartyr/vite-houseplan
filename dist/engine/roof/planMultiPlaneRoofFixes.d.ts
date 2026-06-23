import type { MultiPlaneRoofSpec } from '../types';
export type RoofFixPatch = {
    kind: 'syncRidgeDivider';
    faceId: string;
    ridgeId: string;
    itemIndex: number;
    nextA: {
        x: number;
        z: number;
    };
    nextB: {
        x: number;
        z: number;
    };
};
export type RoofFixPlan = {
    ask: RoofFixPatch[];
    errors: string[];
};
export declare function planMultiPlaneRoofFixes(before: MultiPlaneRoofSpec, after: MultiPlaneRoofSpec): RoofFixPlan;
export declare function applyRoofFixPlan(roof: MultiPlaneRoofSpec, plan: RoofFixPlan): MultiPlaneRoofSpec;
