import { ArchitecturalHouse } from "../engine/architecturalTypes";

/**
 * Mock JSON-like architectural input.
 * Level footprints live here so engine code can consume them as source data.
 */
export const architecturalInput = {
  levels: [
    {
      id: "ground",
      elevation: 0,
      height: 2.8,
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
      slab: {
        thickness: 0.3,
        inset: 0,
      },
    },
    {
      id: "first",
      elevation: 3.05,
      height: 2.8,
      footprint: {
        outer: [
          { x: 3.5, z: 12 },
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
      slab: {
        thickness: 0.25,
        inset: 0,
      },
    },
  ],
} satisfies Pick<ArchitecturalHouse, "levels">;
