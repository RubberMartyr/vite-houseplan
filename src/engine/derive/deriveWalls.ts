import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedSlab } from './deriveSlabs';
import { deriveWallSegmentsFromLevels } from '../deriveWalls';

type DeriveWallsContext = {
  slabs: DerivedSlab[];
};

export function deriveWalls(arch: ArchitecturalHouse, _context: DeriveWallsContext) {
  return deriveWallSegmentsFromLevels(arch);
}
