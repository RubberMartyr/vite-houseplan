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
    return buildExtrudedShell({
      outerPoints: outer,
      innerPoints: inner,
      height: bandHeight,
      baseY: bandBaseY,
    });
  })(),
};
