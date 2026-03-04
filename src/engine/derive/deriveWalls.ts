import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedSlab } from './deriveSlabs';
import { deriveWallSegmentsFromLevels } from '../deriveWalls';

export function deriveWalls(arch: ArchitecturalHouse, _slabs: DerivedSlab[]) {
  return deriveWallSegmentsFromLevels(arch);
}
