import { buildRoofFromCurrentSystem } from './buildRoof';
import { buildWallsFromCurrentSystem } from './buildWalls';
import { architecturalHouse } from './architecturalHouse';
import type { ArchitecturalHouse, LevelSpec } from './architecturalTypes';
import { deriveWallSegmentsFromLevels } from './deriveWalls';
import { houseData } from './houseData';
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
  console.log('Derived walls:', derivedWalls);

  return {
    walls: buildWallsFromCurrentSystem(),
    roof: buildRoofFromCurrentSystem(),
  };
}
