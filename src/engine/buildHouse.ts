import { buildRoofFromCurrentSystem } from './buildRoof';
import { buildWallsFromCurrentSystem } from './buildWalls';
import { architecturalHouse } from './architecturalHouse';
import type { ArchitecturalHouse, LevelSpec } from './architecturalTypes';
import { buildFacadePanelsWithOpenings } from './builders/buildFacadePanels';
import { buildWindowMeshes } from './builders/buildWindowMeshes';
import { deriveOpenings } from './derive/deriveOpenings';
import { deriveWallSegmentsFromLevels } from './deriveWalls';
import { houseData } from './houseData';
import { toThreeWorldMeshes } from './toThreeWorldMeshes';
import { validateOpenings } from './validation/validateOpenings';
import { validateStructure } from './validation/validateStructure';

export function buildHouse() {
  void houseData;
  validateStructure<ArchitecturalHouse>(architecturalHouse, {
    getLevels: (house) => house.levels,
    getLevelElevation: (level) => (level as LevelSpec).elevation,
    getLevelHeight: (level) => (level as LevelSpec).height,
    getSlabThickness: (level) => (level as LevelSpec).slab?.thickness ?? null,
    elevationConvention: 'TOP_OF_SLAB',
    allowGroundSupport: true,
  });

  validateOpenings(architecturalHouse);

  const derivedWalls = deriveWallSegmentsFromLevels(architecturalHouse);
  const derivedOpenings = deriveOpenings(architecturalHouse);

  const facadePanelDepth = 0.025;

  const wallMeshes = architecturalHouse.levels.flatMap((level, levelIndex) =>
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

  console.log('Derived walls:', derivedWalls);

  return {
    walls: buildWallsFromCurrentSystem(),
    roof: buildRoofFromCurrentSystem(),
    worldMeshes: toThreeWorldMeshes([...wallMeshes, ...openingMeshes]),
  };
}
