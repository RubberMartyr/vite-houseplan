import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
type MergeResult = {
    walls: DerivedWallSegment[];
    openings: DerivedOpening[];
};
export declare function mergeExteriorWallsForRendering(walls: DerivedWallSegment[], openings: DerivedOpening[]): MergeResult;
export {};
