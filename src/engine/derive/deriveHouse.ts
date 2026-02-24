import type { ArchitecturalHouse, LevelSpec } from '../types';
import { validateStructure } from '../validation/validateStructure';
import { deriveSlabs } from './deriveSlabs';

export function deriveHouse(house: ArchitecturalHouse) {
  validateStructure(house, {
    getLevels: (h) => h.levels,
    getLevelElevation: (lvl) => (lvl as LevelSpec).elevation,
    getLevelHeight: (lvl) => (lvl as LevelSpec).height,
    getSlabThickness: (lvl) => (lvl as LevelSpec).slab?.thickness ?? null,
    elevationConvention: 'TOP_OF_SLAB',
    allowGroundSupport: true,
  });

  const slabs = deriveSlabs(house);

  return {
    slabs,
  };
}
