import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedExteriorAccessCutout, DerivedExteriorAccessPart } from './types/DerivedExteriorAccess';
type DeriveExteriorAccessesContext = {
    walls: DerivedWallSegment[];
};
type DerivedExteriorAccessesResult = {
    parts: DerivedExteriorAccessPart[];
    cutouts: DerivedExteriorAccessCutout[];
};
export declare function deriveExteriorAccesses(house: ArchitecturalHouse, context: DeriveExteriorAccessesContext): DerivedExteriorAccessesResult;
export {};
