import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { wallThickness } from './houseSpec';
import { buildExtrudedShell } from './builders/buildExtrudedShell';

const EAVES_BAND_BASE_Y = 5.1;
const EAVES_BAND_THICKNESS = 0.12;
export const EAVES_BAND_TOP_Y = EAVES_BAND_BASE_Y + EAVES_BAND_THICKNESS;
const bandBaseY = EAVES_BAND_BASE_Y;
const bandHeight = EAVES_BAND_THICKNESS;
const exteriorThickness = wallThickness.exterior;

export const wallsEavesBand = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
    const bounds = outer.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minZ: Math.min(acc.minZ, point.z),
        maxZ: Math.max(acc.maxZ, point.z),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
      }
    );
    console.log('EAVES BAND footprint bounds', bounds);

    return buildExtrudedShell({
      outerPoints: outer,
      innerPoints: inner,
      height: bandHeight,
      baseY: bandBaseY,
    });
  })(),
};
