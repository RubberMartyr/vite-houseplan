import { wallThickness } from './houseSpec';
import { FootprintPoint, getEnvelopeOuterPolygon } from './envelope';

export const LEFT_FACADE_EPS = 0.01;

export type LeftFacadeMetrics = {
  leftX: number;
  innerLeftX: number;
  leftEdgePoints: FootprintPoint[];
  zMin: number;
  zMax: number;
  centerZ: number;
  widthZ: number;
};

let loggedLeftFacade = false;

export function getLeftFacadeMetrics(polygon: FootprintPoint[] = getEnvelopeOuterPolygon()): LeftFacadeMetrics {
  const pts = polygon ?? [];
  const leftX = Math.min(...pts.map((p) => p.x));
  if (!loggedLeftFacade) {
    console.log('✅ LEFT FACADE X (minX)', leftX);
    loggedLeftFacade = true;
  }
  const leftEdgePoints = pts.filter((point) => Math.abs(point.x - leftX) < LEFT_FACADE_EPS);
  const zValues = leftEdgePoints.map((point) => point.z);
  const zMin = zValues.length > 0 ? Math.min(...zValues) : 0;
  const zMax = zValues.length > 0 ? Math.max(...zValues) : 0;

  return {
    leftX,
    innerLeftX: leftX + wallThickness.exterior,
    leftEdgePoints,
    zMin,
    zMax,
    centerZ: (zMin + zMax) / 2,
    widthZ: zMax - zMin,
  };
}
