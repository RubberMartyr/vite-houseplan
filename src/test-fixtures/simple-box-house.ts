import type { ArchitecturalHouse } from '../engine/architecturalTypes';

export const simpleBoxHouse: ArchitecturalHouse = {
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
          { x: 10, z: 8 },
          { x: 0, z: 8 },
        ],
      },
    },
  ],
};
