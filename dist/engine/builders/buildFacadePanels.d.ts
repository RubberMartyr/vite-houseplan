import type { Vec2 } from '../architecturalTypes';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { EngineMesh } from './buildWindowMeshes';
export type FacadePanelMesh = EngineMesh;
type BuildFacadePanelsInput = {
    outer: Vec2[];
    levelIndex: number;
    wallHeight: number;
    wallBase: number;
    panelThickness?: number;
    openings: DerivedOpeningRect[];
};
export declare function buildFacadePanelsWithOpenings({ outer, levelIndex, wallHeight, wallBase, panelThickness, openings, }: BuildFacadePanelsInput): FacadePanelMesh[];
export {};
