import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { DerivedWallSegment } from '../deriveWalls';
export interface WallPieceRect {
    uMin: number;
    uMax: number;
    vMin: number;
    vMax: number;
}
export declare function splitWallByOpenings(wallLength: number, wallHeight: number, openings: DerivedOpening[], wall?: Pick<DerivedWallSegment, 'id' | 'levelId'> & {
    edgeIndex?: number;
}): WallPieceRect[];
