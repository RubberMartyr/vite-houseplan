import type { RoofCornerTriangle, RoofPoint, RoofSeamBase } from "./types";
export declare function pickCornerFromEdgeContainingBase(footprint: RoofPoint[], seamBase: RoofPoint): RoofPoint | null;
export declare function deriveCornerTriangles(footprint: RoofPoint[], seamBases: RoofSeamBase[], ridgeSegments: Array<{
    id: string;
    start: RoofPoint;
    end: RoofPoint;
}>): RoofCornerTriangle[];
