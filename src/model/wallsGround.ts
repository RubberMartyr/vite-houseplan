import { BoxGeometry } from 'three';
import { getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, wallThickness } from './houseSpec';

type WallSegment = {
  position: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;

const envelopePoints = getEnvelopeOuterPolygon();

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

const buildWallEdge = (
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  height: number,
  thickness: number,
  i: number
): WallSegment | null => {
  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;
  const edgeLen = Math.hypot(dx, dz);

  if (edgeLen === 0) {
    return null;
  }

  const midX = (p0.x + p1.x) / 2;
  const midZ = (p0.z + p1.z) / 2;
  const yaw = Math.atan2(dz, dx);

  const normalX = dz / edgeLen;
  const normalZ = -dx / edgeLen;

  const centerX = midX + normalX * (thickness / 2);
  const centerZ = midZ + normalZ * (thickness / 2);

  console.log('edge', i, 'len', edgeLen.toFixed(3), 'mid', midX.toFixed(3), midZ.toFixed(3));

  return {
    geometry: new BoxGeometry(edgeLen, height, thickness),
    position: [centerX, height / 2, centerZ],
    rotation: [0, yaw, 0],
  };
};

for (let i = 0; i < points.length; i++) {
  const p0 = points[i];
  const p1 = points[(i + 1) % points.length];
  const segment = buildWallEdge(p0, p1, wallHeight, exteriorThickness, i);

  if (segment) {
    segments.push(segment);
  }
}

export const wallsGround = {
  segments,
};
