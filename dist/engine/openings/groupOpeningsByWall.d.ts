import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
export declare function groupOpeningsByWall(walls: DerivedWallSegment[], openings: DerivedOpening[]): Map<string, DerivedOpening[]>;
