import type { ArchitecturalHouse, MultiPlaneRoofSpec } from '../engine/architecturalTypes';

const roof: MultiPlaneRoofSpec = {
  id: 'roof-main',
  type: 'multi-plane',
  baseLevelId: 'ground',
  eaveHeight: 1.2,
  thickness: 0.24,
  overhang: 0.35,
  ridgeSegments: [
    {
      id: 'r1',
      start: { x: 5, z: 2 },
      end: { x: 5, z: 8 },
      height: 2.1,
      hipStart: true,
      hipEnd: true,
    },
  ],
  faces: [
    { id: 'hip-start', kind: 'hipCap', ridgeId: 'r1', capEnd: 'start', region: { type: 'ridgeCapTriangle', ridgeId: 'r1', end: 'start' } },
    { id: 'hip-end', kind: 'hipCap', ridgeId: 'r1', capEnd: 'end', region: { type: 'ridgeCapTriangle', ridgeId: 'r1', end: 'end' } },
    {
      id: 'left-side',
      kind: 'ridgeSideSegment',
      ridgeId: 'r1',
      side: 'left',
      region: {
        type: 'halfPlanes',
        planes: [
          { a: { x: 5, z: 2 }, b: { x: 5, z: 8 }, keep: 'left' },
        ],
      },
      p1: { x: 0, z: 0, h: 1.2 },
      p2: { x: 5, z: 2, h: 2.1 },
      p3: { x: 5, z: 8, h: 2.1 },
    },
    {
      id: 'right-side',
      kind: 'ridgeSideSegment',
      ridgeId: 'r1',
      side: 'right',
      region: {
        type: 'halfPlanes',
        planes: [
          { a: { x: 5, z: 2 }, b: { x: 5, z: 8 }, keep: 'right' },
        ],
      },
      p1: { x: 10, z: 0, h: 1.2 },
      p2: { x: 5, z: 2, h: 2.1 },
      p3: { x: 5, z: 8, h: 2.1 },
    },
  ],
};

export const multiRidgeHouse: ArchitecturalHouse = {
  wallThickness: 0.3,
  levels: [
    {
      id: 'ground',
      name: 'Ground',
      elevation: 0,
      height: 3,
      slab: { thickness: 0.25, inset: 0 },
      footprint: {
        outer: [
          { x: 0, z: 0 },
          { x: 10, z: 0 },
          { x: 10, z: 10 },
          { x: 0, z: 10 },
        ],
      },
    },
  ],
  roofs: [roof],
};
