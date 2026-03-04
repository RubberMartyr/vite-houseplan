import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedRoof } from './types/DerivedRoof';

export function deriveRoofs(arch: ArchitecturalHouse): DerivedRoof[] {
  const { roofs = [] } = arch;

  return roofs.map((roof) => ({
    id: roof.id,
    kind: roof.type,
    baseLevelId: roof.baseLevelId,
    spec: roof,
  }));
}
