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
const envelopeCentroid = (() => {
  const { sumX, sumZ } = envelopePoints.reduce(
    (acc, point) => ({
      sumX: acc.sumX + point.x,
      sumZ: acc.sumZ + point.z,
    }),
    { sumX: 0, sumZ: 0 }
  );

  return {
    x: sumX / envelopePoints.length,
    z: sumZ / envelopePoints.length,
  };
})();

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
  const yaw = Math.atan2(dz, dx);
  const nx = Math.sin(yaw);
  const nz = Math.cos(yaw);

  let centerX = midX + nx * (exteriorThickness / 2);
  let centerZ = midZ + nz * (exteriorThickness / 2);

  const shiftedDistance = Math.hypot(centerX - envelopeCentroid.x, centerZ - envelopeCentroid.z);
  const originalDistance = Math.hypot(midX - envelopeCentroid.x, midZ - envelopeCentroid.z);

  if (shiftedDistance > originalDistance) {
    centerX = midX - nx * (exteriorThickness / 2);
    centerZ = midZ - nz * (exteriorThickness / 2);
  }

  segments.push({
    geometry: new BoxGeometry(edgeLen, wallHeight, exteriorThickness),
    position: [centerX, wallHeight / 2, centerZ],
    rotation: [0, yaw, 0],
  });
}

export const wallsFirst = {
  segments,
};
