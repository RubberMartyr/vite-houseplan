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
          id: "main",
          start: { x: 0.6, z: 8.7 },
          end: { x: 0.6, z: 4.31 },
          height: 6.45,
        },
      ],
      faces: [
        {
          id: "left-start",
          kind: "ridgeSideSegment",
          ridgeId: "main",
          side: "left",
          capEnd: "start",
          ridgeT0: 0.0,
          ridgeT1: 0.5,
          region: {
            type: "compound",
            items: [
              { type: "ridgePerpCut", ridgeId: "main", t: 0.0, keep: "ahead" },
              { type: "ridgePerpCut", ridgeId: "main", t: 0.5, keep: "behind" },
            ],
          },
        },
        {
          id: "left-end",
          kind: "ridgeSideSegment",
          ridgeId: "main",
          side: "left",
          capEnd: "end",
          ridgeT0: 0.5,
          ridgeT1: 1.0,
          region: {
            type: "compound",
            items: [
              { type: "ridgePerpCut", ridgeId: "main", t: 0.5, keep: "ahead" },
              { type: "ridgePerpCut", ridgeId: "main", t: 1.0, keep: "behind" },
            ],
          },
        },
        {
          id: "right-start",
          kind: "ridgeSideSegment",
          ridgeId: "main",
          side: "right",
          capEnd: "start",
          ridgeT0: 0.0,
          ridgeT1: 0.5,
          region: {
            type: "compound",
            items: [
              { type: "ridgePerpCut", ridgeId: "main", t: 0.0, keep: "ahead" },
              { type: "ridgePerpCut", ridgeId: "main", t: 0.5, keep: "behind" },
            ],
          },
        },
        {
          id: "right-end",
          kind: "ridgeSideSegment",
          ridgeId: "main",
          side: "right",
          capEnd: "end",
          ridgeT0: 0.5,
          ridgeT1: 1.0,
          region: {
            type: "compound",
            items: [
              { type: "ridgePerpCut", ridgeId: "main", t: 0.5, keep: "ahead" },
              { type: "ridgePerpCut", ridgeId: "main", t: 1.0, keep: "behind" },
            ],
          },
        },
        {
          id: "hip-front",
          kind: "hipCap",
          region: { type: "ridgeCapTriangle", ridgeId: "main", end: "start" },
        },
        {
          id: "hip-end",
          kind: "hipCap",
          region: { type: "ridgeCapTriangle", ridgeId: "main", end: "end" },
        },
      ],
    },
  ],

  openings: [
    // Leave empty for now.
    // We will migrate windows in Phase 6.
  ],
};
