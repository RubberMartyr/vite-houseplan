import { getEnvelopeOuterPolygon } from '../model/envelope';
import { ceilingHeights, wallThickness } from '../model/houseSpec';
import { EAVES_BAND_TOP_Y } from '../model/wallsEavesBand';
import { HouseSpec } from './types';

const MAIN_RIDGE_Y = 9.85;
const MAIN_PITCHED_HALF_SPAN = 2.4;

const outer = getEnvelopeOuterPolygon();

export const houseData: HouseSpec = {
  walls: outer.slice(0, -1).map((point, index) => {
    const next = outer[index + 1];

    return {
      id: `wall-${index + 1}`,
      baseLine: [
        { x: point.x, y: 0, z: point.z },
        { x: next.x, y: 0, z: next.z },
      ],
      height: ceilingHeights.ground,
      thickness: wallThickness.exterior,
    };
  }),
  openings: [],
  roof: {
    ridgeHeight: MAIN_RIDGE_Y,
    slope: Math.atan((MAIN_RIDGE_Y - EAVES_BAND_TOP_Y) / MAIN_PITCHED_HALF_SPAN) * (180 / Math.PI),
  },
};
