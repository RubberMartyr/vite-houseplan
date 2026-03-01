import type { ArchitecturalHouse, LevelSpec } from '../types';
import { validateOpenings } from '../validation/validateOpenings';
import { validateStructure } from '../validation/validateStructure';
import { deriveSlabs } from './deriveSlabs';

export function deriveHouse(house: ArchitecturalHouse) {
  const validationReport = validateStructure(house, {
    getLevels: (h) => h.levels,
    getLevelElevation: (lvl) => (lvl as LevelSpec).elevation,
    getLevelHeight: (lvl) => (lvl as LevelSpec).height,
    getSlabThickness: (lvl) => (lvl as LevelSpec).slab?.thickness ?? null,
    elevationConvention: 'TOP_OF_SLAB',
    allowGroundSupport: true,
  },
  {
    mode: 'report',
  });

  validateOpenings(house);

  if (!validationReport.ok) {
    validationReport.issues.forEach((issue) => {
      const log = issue.severity === 'error' ? console.error : console.warn;
      log(`[validateStructure] ${issue.message}`, issue);
    });
  }

  const slabs = deriveSlabs(house);

  return {
    slabs,
  };
}
