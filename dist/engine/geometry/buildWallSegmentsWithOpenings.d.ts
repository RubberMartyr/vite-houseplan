import type { DerivedOpeningRect } from '../derive/types/derivedOpenings';
export interface WallSegmentPiece {
    startU: number;
    endU: number;
    bottom: number;
    top: number;
}
export declare function splitWallByOpenings(wallLength: number, wallHeight: number, openings: DerivedOpeningRect[]): WallSegmentPiece[];
