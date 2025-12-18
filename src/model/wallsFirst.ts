import { BoxGeometry } from 'three';
import { getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, wallThickness } from './houseSpec';

type WallSegment = {
  position: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;

const envelopePoints = getEnvelopeOuterPolygon();
const isClockwise = envelopePoints.reduce((area, point, index) => {
  const next = envelopePoints[(index + 1) % envelopePoints.length];
  return area + point.x * next.z - next.x * point.z;
}, 0) < 0;

const points = (() => {
  const list = [...envelopePoints];
  if (list.length > 1) {
    const first = list[0];
    const last = list[list.length - 1];
    if (first.x === last.x && first.z === last.z) {
      list.pop();
    }
  }
  return list;
})();

const segments: WallSegment[] = [];

for (let i = 0; i < points.length; i++) {
  const p0 = points[i];
  const p1 = points[(i + 1) % points.length];
  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;
  const edgeLen = Math.hypot(dx, dz);

  if (edgeLen === 0) {
    continue;
  }

  const midX = (p0.x + p1.x) / 2;
  const midZ = (p0.z + p1.z) / 2;
  const ux = dx / edgeLen;
  const uz = dz / edgeLen;
  const nx = isClockwise ? -uz : uz;
  const nz = isClockwise ? ux : -ux;
  const centerOffset: [number, number, number] = [
    -(nx * exteriorThickness) / 2,
    0,
    -(nz * exteriorThickness) / 2,
  ];
  const yaw = Math.atan2(dz, dx);

  segments.push({
    geometry: new BoxGeometry(edgeLen, wallHeight, exteriorThickness),
    position: [midX + centerOffset[0], wallHeight / 2, midZ + centerOffset[2]],
    rotation: [0, yaw, 0],
  });
}

export const wallsFirst = {
  segments,
};
