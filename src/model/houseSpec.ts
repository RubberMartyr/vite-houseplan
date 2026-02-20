import { ensureCounterClockwise } from './utils/geometry';
import { cmToMeters } from './utils/units';
import type { HouseSpec } from './types/HouseSpec';

export type EnvelopePoint = { x: number; z: number };
export type ArchSide = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT';

// Architectural orientation mapping
export const ARCH_SIDE_TO_WORLD_X = {
  LEFT: +1,
  RIGHT: -1,
} as const;

export const depthCm = 1500;
export const frontWidthCm = 960;
export const rearWidthCm = 760;

export const leftFacadeProfileCm: EnvelopePoint[] = [
  { z: 0, x: -480 },
  { z: 400, x: -480 },
  { z: 400, x: -410 },
  { z: 845, x: -410 },
  { z: 845, x: -350 },
  { z: 1200, x: -350 },
  { z: depthCm, x: -350 },
];

export const rightFacadeProfileCm: EnvelopePoint[] = leftFacadeProfileCm.map((point) => ({
  z: point.z,
  x: Math.abs(point.x),
}));

export const leftFacadeProfile: EnvelopePoint[] = leftFacadeProfileCm.map((point) => ({
  x: cmToMeters(point.x),
  z: cmToMeters(point.z),
}));

export const rightFacadeProfile: EnvelopePoint[] = rightFacadeProfileCm.map((point) => ({
  x: cmToMeters(point.x),
  z: cmToMeters(point.z),
}));

export const frontWidth = cmToMeters(frontWidthCm);
export const rearWidth = cmToMeters(rearWidthCm);
export const depth = cmToMeters(depthCm);

// Stepped facade is on the right (+X) side. rightFacadeProfile already
// carries correct positive-X coordinates — no X-flip needed.
const frontLeft: EnvelopePoint = { x: -(frontWidth / 2), z: 0 };
const rearRight = rightFacadeProfile[rightFacadeProfile.length - 1];
const rearLeft: EnvelopePoint = { x: rearRight.x - rearWidth, z: depth };

const envelopeOutlineRaw: EnvelopePoint[] = [
  frontLeft,
  ...rightFacadeProfile,
  rearLeft,
];

if (import.meta.env.DEV) {
  const ccw = ensureCounterClockwise([...envelopeOutlineRaw]);
  const reversed = ccw[0].x !== envelopeOutlineRaw[0].x || ccw[0].z !== envelopeOutlineRaw[0].z;

  if (reversed) {
    console.error('[houseSpec] winding reversed — check rightFacadeProfile order');
  }
}

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

if (import.meta.env.DEV && Math.abs(originOffset.x) > 1e-4) {
  console.error(`[houseSpec] originOffset.x = ${originOffset.x} — envelope not X-centred`);
}

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

export const houseSpec: HouseSpec = {
  envelopeOutline,
  wallThickness,
  ceilingHeights,
  levelHeights,
  originOffset,
  groundFloorRooms,
};

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
