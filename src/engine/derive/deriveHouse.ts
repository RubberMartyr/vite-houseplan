import type { ArchitecturalHouse, LevelSpec } from '../types';
import { buildFacadePanelsWithOpenings } from '../builders/buildFacadePanels';
import { buildWindowMeshes } from '../builders/buildWindowMeshes';
import { validateOpenings } from '../validation/validateOpenings';
import { toThreeWorldMeshes } from '../toThreeWorldMeshes';
import { validateStructure } from '../validation/validateStructure';
import { deriveOpenings } from './deriveOpenings';
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

  const derivedSlabs = deriveSlabs(house);
  const derivedOpenings = deriveOpenings(house);

  const facadePanelDepth = 0.025;

  const facadePanels = house.levels.flatMap((level, levelIndex) =>
    buildFacadePanelsWithOpenings({
      outer: level.footprint.outer,
      levelIndex,
      wallHeight: level.height,
      wallBase: level.elevation,
      panelThickness: facadePanelDepth,
      openings: derivedOpenings,
    })
  );

  const openingMeshes = buildWindowMeshes(derivedOpenings, {
    panelDepth: facadePanelDepth,
  });

  console.log('RETURNING PANELS:', facadePanels.length);

  return {
    slabs: derivedSlabs,
    openings: derivedOpenings,
    worldMeshes: toThreeWorldMeshes([...facadePanels, ...openingMeshes]),
  };
}
