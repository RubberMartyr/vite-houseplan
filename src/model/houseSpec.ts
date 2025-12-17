export const footprint = {
  width: 8.2,
  depth: 12.5,
};

export const footprintWidth = footprint.width;
export const footprintDepth = footprint.depth;

export const frontZ = -footprintDepth / 2;
export const rearZ = footprintDepth / 2;
export const leftX = -footprintWidth / 2;
export const rightX = footprintWidth / 2;

export const wallThickness = {
  exterior: 0.35,
  interior: 0.14,
};

export const ceilingHeights = {
  ground: 2.6,
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
  footprint,
  wallThickness,
  ceilingHeights,
  groundFloorRooms,
};
