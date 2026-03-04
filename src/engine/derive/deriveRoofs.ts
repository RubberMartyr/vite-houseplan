import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedRoof } from './types/DerivedRoof';

export function deriveRoofs(arch: ArchitecturalHouse): DerivedRoof[] {
  if (!arch.roofs) return [];

  return arch.roofs.map((roof) => ({
    id: roof.id,
    kind: roof.kind,
    baseLevelId: roof.baseLevelId,
    spec: roof,
  }));
}
