import { ArchitecturalHouse } from "./architecturalTypes";

/**
 * This mirrors the current house geometry but expressed
 * as architectural intent instead of derived geometry.
 */
export const architecturalHouse: ArchitecturalHouse = {
  levels: [
    {
      id: "ground",
      elevation: 0,
      height: 2.8, // match current
      footprint: {
        outer: [
          { x: -4.8, z: 0 },
          { x: 4.8, z: 0 },
          { x: 3.8, z: 15 },
          { x: -3.8, z: 15 },
        ],
      },
    },
    {
      id: "first",
      elevation: 2.8,
      height: 2.8,
      footprint: {
        outer: [
          { x: -4.2, z: 0.6 },
          { x: 4.2, z: 0.6 },
          { x: 3.3, z: 14.4 },
          { x: -3.3, z: 14.4 },
        ],
      },
    },
  ],

  wallThickness: 0.3, // match current

  roof: {
    type: "gable",
    slopeDeg: 35, // match current
    ridgeDirection: "x", // match current
    overhang: 0.3,
  },

  openings: [
    // Leave empty for now.
    // We will migrate windows in Phase 6.
  ],
};
