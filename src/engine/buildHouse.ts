import { buildRoofFromCurrentSystem } from './buildRoof';
import { buildWallsFromCurrentSystem } from './buildWalls';
import { architecturalHouse } from './architecturalHouse';
import type { ArchitecturalHouse, LevelSpec } from './architecturalTypes';
import { buildFacadePanelsWithOpenings } from './builders/buildFacadePanels';
import { buildWindowMeshes } from './builders/buildWindowMeshes';
import { deriveOpenings } from './derive/deriveOpenings';
import { getStructuralWallHeight } from './derive/getStructuralWallHeight';
import { deriveWallSegmentsFromLevels } from './deriveWalls';
import { deriveSlabs } from './derive/deriveSlabs';
import { houseData } from './houseData';
import { toThreeWorldMeshes } from './toThreeWorldMeshes';
import { validateOpenings } from './validation/validateOpenings';
import { validateRooms } from './validation/validateRooms';
import { validateStructure } from './validation/validateStructure';
import { normalizeArchitecturalHouse } from './normalizeArchitecturalHouse';

export function buildHouse() {
  void houseData;
  const normalizedArchitecturalHouse = normalizeArchitecturalHouse(architecturalHouse);

  validateStructure<ArchitecturalHouse>(normalizedArchitecturalHouse, {
    getLevels: (house) => house.levels,
    getLevelElevation: (level) => (level as LevelSpec).elevation,
    getLevelHeight: (_level, index) => getStructuralWallHeight(normalizedArchitecturalHouse.levels, index),
    getSlabThickness: (level) => (level as LevelSpec).slab?.thickness ?? null,
    elevationConvention: 'TOP_OF_SLAB',
    allowGroundSupport: true,
  });
  validateRooms(normalizedArchitecturalHouse);

  validateOpenings(normalizedArchitecturalHouse);

  const derivedSlabs = deriveSlabs(normalizedArchitecturalHouse);
  const derivedWalls = deriveWallSegmentsFromLevels(normalizedArchitecturalHouse);
  const derivedOpenings = deriveOpenings(normalizedArchitecturalHouse, {
    slabs: derivedSlabs,
    walls: derivedWalls,
  });

  const facadePanelDepth = 0.025;

  const facadePanels = normalizedArchitecturalHouse.levels.flatMap((level, levelIndex) =>
    buildFacadePanelsWithOpenings({
      outer: level.footprint.outer,
      levelIndex,
      wallHeight: getStructuralWallHeight(normalizedArchitecturalHouse.levels, levelIndex),
      wallBase: level.elevation,
      panelThickness: facadePanelDepth,
      openings: derivedOpenings,
    })
  );
  const openingMeshes = buildWindowMeshes(derivedOpenings, {
    panelDepth: facadePanelDepth,
  });

  console.log('Derived walls:', derivedWalls);

  console.log('RETURNING PANELS:', facadePanels.length);

  return {
    walls: buildWallsFromCurrentSystem(),
    roof: buildRoofFromCurrentSystem(),
    worldMeshes: toThreeWorldMeshes([...facadePanels, ...openingMeshes]),
  };
}
