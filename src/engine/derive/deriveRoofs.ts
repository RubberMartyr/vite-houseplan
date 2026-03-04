import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';

export function deriveRoofs(arch: ArchitecturalHouse, _walls: DerivedWallSegment[]) {
  return arch.roofs ?? [];
}
