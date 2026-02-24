import { ArchitecturalHouse } from "./architecturalTypes";

/**
 * This mirrors the current house geometry but expressed
 * as architectural intent instead of derived geometry.
 */
export const architecturalHouse: ArchitecturalHouse = {
  wallThickness: 0.3, // match current

  levels: [
    {
      id: "ground",
      elevation: 0,
      height: 2.8, // match current
      slabThickness: 0.3,
      footprint: {
        outer: [
          { x: -4.1, z: 15 },
          { x: 3.5, z: 15 },
          { x: 3.5, z: 12 },
          { x: 3.5, z: 8.45 },
          { x: 4.1, z: 8.45 },
          { x: 4.1, z: 4 },
          { x: 4.8, z: 4 },
          { x: 4.8, z: 0 },
          { x: -4.8, z: 0 },
        ],
      },
    },
    {
      id: "first",
      elevation: 2.8,
      height: 2.8,
      slabThickness: 0.25,
      footprint: {
        outer: [
          { x: 3.5, z: 12 },
          { x: 3.5, z: 8.45 },
          { x: 4.1, z: 8.45 },
          { x: 4.1, z: 4 },
          { x: 4.8, z: 4 },
          { x: 4.8, z: 0 },
          { x: -4.8, z: 0 },
          { x: -4.1, z: 12 },
        ],
      },
    },
  ],

  roofs: [
    {
      id: "ground-flat",
      type: "flat",
      baseLevelId: "ground",
      subtractAboveLevelId: "first",
      thickness: 0.2,
    },
    {
      id: "main-gable",
      type: "gable",
      baseLevelId: "first",
      slopeDeg: 35,
      ridgeDirection: "x",
      overhang: 0.3,
      thickness: 0.2,
    },
  ],

  openings: [
    // Leave empty for now.
    // We will migrate windows in Phase 6.
  ],
};
