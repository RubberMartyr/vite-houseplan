import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedSlab } from './deriveSlabs';
type DeriveWallsContext = {
    slabs: DerivedSlab[];
};
export declare function deriveWalls(arch: ArchitecturalHouse, _context: DeriveWallsContext): import("../deriveWalls").DerivedWallSegment[];
export {};
