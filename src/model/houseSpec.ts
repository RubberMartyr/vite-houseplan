export type EnvelopePoint = { x: number; z: number };

export const depthCm = 1500;
export const frontWidthCm = 960;
export const rearWidthCm = 760;

export const leftFacadeProfileCm: EnvelopePoint[] = [
  { z: 0, x: -480 },
  { z: 400, x: -480 },
  { z: 400, x: -410 },
  { z: 845, x: -410 },
  { z: 845, x: -350 },
  { z: depthCm, x: -350 },
];

export const rightFacadeProfileCm: EnvelopePoint[] = leftFacadeProfileCm.map((point) => ({
  z: point.z,
  x: 480,
}));

const cmToMeters = (value: number) => value / 100;

export const leftFacadeProfile: EnvelopePoint[] = leftFacadeProfileCm.map((point) => ({
  x: cmToMeters(point.x),
  z: cmToMeters(point.z),
}));

export const rightFacadeProfile: EnvelopePoint[] = rightFacadeProfileCm.map((point) => ({
  x: cmToMeters(point.x),
  z: cmToMeters(point.z),
}));

export const LEFT_FACADE_SEGMENTS = [
  { id: 'R_A', z0: 0.0, z1: 4.0, x: -4.8 },
  { id: 'R_B', z0: 4.0, z1: 8.45, x: -4.1 },
  { id: 'R_C', z0: 8.45, z1: 12.0, x: -3.5 },
] as const;

const frontLeft = leftFacadeProfile[0];
const rearLeft = leftFacadeProfile[leftFacadeProfile.length - 1];
const frontRight = rightFacadeProfile[0];
const rearRight = rightFacadeProfile[rightFacadeProfile.length - 1];
export const frontWidth = cmToMeters(frontWidthCm);
export const rearWidth = cmToMeters(rearWidthCm);
export const depth = cmToMeters(depthCm);

export const RIGHT_FACADE_SEGMENTS = [
  { id: 'R_A', z0: 0.0, z1: 4.0, x: 4.8 },
  { id: 'R_B', z0: 4.0, z1: 8.45, x: 4.8 },
  { id: 'R_C', z0: 8.45, z1: 12.0, x: 4.8 },
] as const;

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

// Keep the outline in world space without mirroring so the indented facade stays on -X.
export const envelopeOutline: EnvelopePoint[] = ensureCounterClockwise(envelopeOutlineRaw);

export const envelopeBoundsCm = envelopeOutline.reduce(
  (acc, point) => ({
    minX: Math.min(acc.minX, point.x * 100),
    maxX: Math.max(acc.maxX, point.x * 100),
    minZ: Math.min(acc.minZ, point.z * 100),
    maxZ: Math.max(acc.maxZ, point.z * 100),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
);

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

export const originOffset = {
  x: -(bounds.minX + bounds.maxX) / 2,
  z: -(bounds.minZ + bounds.maxZ) / 2,
};

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
  rightFacadeProfile,
  rightFacadeProfileCm,
};
