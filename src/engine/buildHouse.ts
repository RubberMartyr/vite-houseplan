import { buildRoofFromCurrentSystem } from './buildRoof';
import { buildWallsFromCurrentSystem } from './buildWalls';
import { houseData } from './houseData';

export function buildHouse() {
  void houseData;

  return {
    walls: buildWallsFromCurrentSystem(),
    roof: buildRoofFromCurrentSystem(),
  };
}
