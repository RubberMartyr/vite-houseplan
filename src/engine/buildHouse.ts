import { buildRoofFromCurrentSystem } from './buildRoof';
import { buildWallsFromCurrentSystem } from './buildWalls';
import { architecturalHouse } from './architecturalHouse';
import { deriveWallSegmentsFromFootprint } from './deriveWalls';
import { houseData } from './houseData';

export function buildHouse() {
  void houseData;
  const derivedWalls = deriveWallSegmentsFromFootprint(architecturalHouse);
  console.log('Derived walls:', derivedWalls);

  return {
    walls: buildWallsFromCurrentSystem(),
    roof: buildRoofFromCurrentSystem(),
  };
}
