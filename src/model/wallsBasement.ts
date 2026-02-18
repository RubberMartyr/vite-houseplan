import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { wallThickness } from './houseSpec';
import { buildExtrudedShell } from './builders/buildExtrudedShell';

const wallHeight = 2.0;
const exteriorThickness = wallThickness.exterior;
const basementFloorLevel = -2.0;

export const wallsBasement = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);

    return buildExtrudedShell({
      outerPoints: outer,
      innerPoints: inner,
      height: wallHeight,
      baseY: basementFloorLevel,
    });
  })(),
};
