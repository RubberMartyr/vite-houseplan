import type { ArchitecturalHouse } from '../engine/architecturalTypes';

export const lShapedHouse: ArchitecturalHouse = {
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
          { x: 12, z: 0 },
          { x: 12, z: 4 },
          { x: 7, z: 4 },
          { x: 7, z: 10 },
          { x: 0, z: 10 },
        ],
      },
    },
  ],
};
