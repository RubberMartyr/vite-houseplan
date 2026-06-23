import { ArchitecturalHouse } from "./architecturalTypes";
import { Vec3 } from "./types";
export type DerivedWallSegment = {
    id: string;
    levelId: string;
    kind?: 'interior' | 'exterior';
    start: Vec3;
    end: Vec3;
    height: number;
    thickness: number;
    outwardSign: 1 | -1;
    uOffset: number;
    visibleBaseY?: number;
    visibleHeight?: number;
};
export declare function getWallVisibleBaseY(segment: DerivedWallSegment): number;
export declare function getWallVisibleHeight(segment: DerivedWallSegment): number;
export declare function getWallVisibleTopY(segment: DerivedWallSegment): number;
export declare function deriveWallSegmentsFromLevels(arch: ArchitecturalHouse): DerivedWallSegment[];
