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

const points = (() => {
  const pts = getEnvelopeOuterPolygon();
  if (pts.length > 1) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first.x === last.x && first.z === last.z) {
      pts.pop();
    }
  }
  return pts;
})();

const segments: WallSegment[] = [];

const pointInPolygonXZ = (
  p: { x: number; z: number },
  poly: { x: number; z: number }[]
): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const zi = poly[i].z;
    const xj = poly[j].x;
    const zj = poly[j].z;

    const intersect =
      zi > p.z !== zj > p.z &&
      p.x < ((xj - xi) * (p.z - zi)) / (zj - zi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

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

  const ux = dx / edgeLen;
  const uz = dz / edgeLen;
  let normalX = -uz;
  let normalZ = ux;

  const testX = midX + normalX * 0.01;
  const testZ = midZ + normalZ * 0.01;

  if (pointInPolygonXZ({ x: testX, z: testZ }, points)) {
    normalX = -normalX;
    normalZ = -normalZ;
  }

  const centerX = midX - normalX * (thickness / 2);
  const centerZ = midZ - normalZ * (thickness / 2);

  return {
    geometry: new BoxGeometry(edgeLen, height, thickness),
    position: [centerX, height / 2, centerZ],
    rotation: [0, yaw, 0],
  };
};

let maxLen = -1;
let maxI = -1;

for (let i = 0; i < points.length; i++) {
  const p0 = points[i];
  const p1 = points[(i + 1) % points.length];
  const len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  if (len > maxLen) {
    maxLen = len;
    maxI = i;
  }
  const segment = buildWallEdge(p0, p1, wallHeight, exteriorThickness, i);

  if (segment) {
    segments.push(segment);
  }
}

console.log('MAX EDGE:', maxI, 'len=', maxLen);
console.log('WALL SEGMENTS:', segments.length);

export const wallsGround = {
  segments,
};
