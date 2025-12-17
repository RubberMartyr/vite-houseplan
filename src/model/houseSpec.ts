export type EnvelopePoint = { x: number; z: number };

export const frontWidth = 9.6;
export const rearWidth = 7.6;
export const depth = 15;

export const leftFacadeProfile: EnvelopePoint[] = [
  { z: 0, x: -4.8 },
  { z: 4, x: -4.8 },
  { z: 4, x: -4.1 },
  { z: 8.45, x: -4.1 },
  { z: 8.45, x: -3.5 },
  { z: depth, x: -3.5 },
];

const frontLeft = leftFacadeProfile[0];
const rearLeft = leftFacadeProfile[leftFacadeProfile.length - 1];
const frontRight = { x: frontLeft.x + frontWidth, z: 0 };
const rearRight = { x: rearLeft.x + rearWidth, z: depth };

function polygonArea(points: EnvelopePoint[]): number {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.z - next.x * point.z;
  }, 0);
}

function ensureCounterClockwise(points: EnvelopePoint[]): EnvelopePoint[] {
  return polygonArea(points) < 0 ? [...points].reverse() : points;
}

const envelopeOutlineRaw: EnvelopePoint[] = [
  frontLeft,
  frontRight,
  rearRight,
  rearLeft,
  ...leftFacadeProfile.slice(1, -1).reverse(),
];

export const envelopeOutline: EnvelopePoint[] = ensureCounterClockwise(envelopeOutlineRaw);

const bounds = envelopeOutline.reduce(
  (acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    maxX: Math.max(acc.maxX, point.x),
    minZ: Math.min(acc.minZ, point.z),
    maxZ: Math.max(acc.maxZ, point.z),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
);

export const footprint = {
  width: bounds.maxX - bounds.minX,
  depth: bounds.maxZ - bounds.minZ,
};

export const footprintWidth = footprint.width;
export const footprintDepth = footprint.depth;

export const frontZ = bounds.minZ;
export const rearZ = bounds.maxZ;
export const leftX = bounds.minX;
export const rightX = bounds.maxX;

export const wallThickness = {
  exterior: 0.35,
  interior: 0.14,
};

export const ceilingHeights = {
  ground: 2.6,
  first: 2.5,
};

export const levelHeights = {
  firstFloor: ceilingHeights.ground,
};

export const groundFloorRooms = {
  zithoek: {
    width: 4.8,
    depth: 4.2,
  },
  keuken: {
    width: 4.8,
    depth: 3.8,
    island: {
      width: 2.8,
      depth: 1.1,
    },
  },
  eethoek: {
    width: 4.8,
    depth: 4.5,
  },
  serviceStrip: {
    width: 2.8,
    hallDepth: 3.5,
    stairDepth: 3.0,
    bergingDepth: 5.0,
  },
};

export type RoomRange = { xMin: number; xMax: number; zMin: number; zMax: number };

export default {
  frontWidth,
  rearWidth,
  depth,
  leftFacadeProfile,
  envelopeOutline,
  footprint,
  wallThickness,
  ceilingHeights,
  levelHeights,
  groundFloorRooms,
};
