import type { ArchitecturalHouse } from '../engine/architecturalTypes';

export const carportHouse: ArchitecturalHouse = {
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
          { x: 9, z: 0 },
          { x: 9, z: 7 },
          { x: 0, z: 7 },
        ],
      },
    },
  ],
  auxiliary: [
    {
      id: 'carport-1',
      type: 'flat',
      attachedTo: { side: 'rear' },
      footprint: {
        outer: [
          { x: 9, z: 1 },
          { x: 12, z: 1 },
          { x: 12, z: 6 },
          { x: 9, z: 6 },
        ],
      },
      heightOffsetFromRoof: 0.2,
      thickness: 0.12,
      columns: {
        spacing: 2,
        size: 0.12,
        insetFromEdge: 0.2,
        sides: {
          front: true,
          rear: true,
          houseSide: false,
          outerSide: true,
        },
      },
      material: {
        roof: '#888',
        columns: '#666',
        underside: '#aaa',
      },
    },
  ],
};
