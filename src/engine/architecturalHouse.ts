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
      slab: {
        thickness: 0.3,
        inset: 0,
      },
      footprint: {
        outer: [
          { x: 4.1, z: 15 },
          { x: -3.5, z: 15 },
          { x: -3.5, z: 12 },
          { x: -3.5, z: 8.45 },
          { x: -4.1, z: 8.45 },
          { x: -4.1, z: 4 },
          { x: -4.8, z: 4 },
          { x: -4.8, z: 0 },
          { x: 4.8, z: 0 },
        ],
      },
    },
    {
      id: "first",
      // TOP_OF_SLAB convention: this is slab top, so it must include slab thickness
      // to keep slab bottom aligned with the level below wall top (2.8m).
      elevation: 3.05,
      height: 2.8,
      slab: {
        thickness: 0.25,
        inset: 0,
      },
      footprint: {
        outer: [
          { x: -3.5, z: 12 },
          { x: -3.5, z: 8.45 },
          { x: -4.1, z: 8.45 },
          { x: -4.1, z: 4 },
          { x: -4.8, z: 4 },
          { x: -4.8, z: 0 },
          { x: 4.8, z: 0 },
          { x: 4.1, z: 12 },
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
      id: "main-roof",
      type: "multi-plane",
      baseLevelId: "first",
      eaveHeight: 2.8,
      thickness: 0.2,
      overhang: 0.3,
      ridgeSegments: [
        {
          id: "main-ridge",
          start: { x: 0.6, z: 12.0 },
          end: { x: 0.6, z: 8.45 },
          height: 6.45,
        },
      ],
      faces: [
        {
          id: "main-A",
          kind: "ridgeSide",
          ridgeId: "main-ridge",
          p1: { x: 0.6, z: 12.0, h: 6.45 },
          p2: { x: 0.6, z: 8.45, h: 6.45 },
          p3: { x: -4.8, z: 12.0, h: 2.8 },
          region: [
            { a: { x: 0.6, z: 12.0 }, b: { x: 0.6, z: 8.45 }, keep: "left" },
          ],
        },
        {
          id: "main-B",
          kind: "ridgeSide",
          ridgeId: "main-ridge",
          p1: { x: 0.6, z: 12.0, h: 6.45 },
          p2: { x: 0.6, z: 8.45, h: 6.45 },
          p3: { x: 4.1, z: 12.0, h: 2.8 },
          region: [
            { a: { x: 0.6, z: 12.0 }, b: { x: 0.6, z: 8.45 }, keep: "right" },
          ],
        },
        {
          id: "hip-front",
          kind: "hipCap",
          p1: { x: 0.6, z: 12.0, h: 6.45 },
          p2: { x: -4.8, z: 12.0, h: 2.8 },
          p3: { x: 4.1, z: 12.0, h: 2.8 },
          region: [],
        },
        {
          id: "hip-end",
          kind: "hipCap",
          p1: { x: 0.6, z: 8.45, h: 6.45 },
          p2: { x: -3.5, z: 8.45, h: 2.8 },
          p3: { x: 4.1, z: 8.45, h: 2.8 },
          region: [],
        },
      ],
    },
  ],

  openings: [
    // Leave empty for now.
    // We will migrate windows in Phase 6.
  ],
};
