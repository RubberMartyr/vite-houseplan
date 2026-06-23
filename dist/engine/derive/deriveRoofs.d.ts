import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedRoof } from './types/DerivedRoof';
import type { DerivedSlab } from './deriveSlabs';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from './types/DerivedOpening';
type DeriveRoofsContext = {
    slabs: DerivedSlab[];
    walls: DerivedWallSegment[];
    openings: DerivedOpening[];
};
export declare function deriveRoofs(arch: ArchitecturalHouse, _context: DeriveRoofsContext): DerivedRoof[];
export {};
