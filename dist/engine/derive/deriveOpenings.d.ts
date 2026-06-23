import type { ArchitecturalHouse, Vec2 } from '../architecturalTypes';
import type { DerivedSlab } from './deriveSlabs';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from './types/DerivedOpening';
type Vec2XZ = {
    x: number;
    z: number;
};
export declare function isPointInsidePolygonXZ(polygon: Vec2[], point: Vec2XZ): boolean;
type DeriveOpeningsContext = {
    slabs: DerivedSlab[];
    walls: DerivedWallSegment[];
};
export declare function deriveOpenings(house: ArchitecturalHouse, context: DeriveOpeningsContext): DerivedOpening[];
export {};
