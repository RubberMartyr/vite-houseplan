import { ArchitecturalHouse } from "./architecturalTypes";

/**
 * This mirrors the current house geometry but expressed
 * as architectural intent instead of derived geometry.
 */
const levels: ArchitecturalHouse['levels'] = [
  {
    id: "ground",
    elevation: 0,
    height: 2.8,
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
];

export const architecturalHouse: ArchitecturalHouse = {
  wallThickness: 0.3, // match current

  levels,

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
    {
      id: 'FRONT_G_W1',
      kind: 'window',
      levelId: 'ground',
      edge: { ring: 'outer', edgeIndex: 0, fromEnd: true },
      offset: 0.45,
      width: 1.1,
      sillHeight: 0.7,
      height: 1.6,
      style: { variant: 'classicTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_G_W2',
      kind: 'window',
      levelId: 'ground',
      edge: { ring: 'outer', edgeIndex: 0, fromEnd: true },
      offset: 2.25,
      width: 1.1,
      sillHeight: 0.7,
      height: 1.6,
      style: { variant: 'classicTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_G_DOOR',
      kind: 'door',
      levelId: 'ground',
      edge: { ring: 'outer', edgeIndex: 0, fromEnd: true },
      offset: 4.3,
      width: 1,
      sillHeight: 0,
      height: 2.5,
      style: { variant: 'doorDetailed', hasSill: false, hasLintel: true, surroundRing: true },
    },
    {
      id: 'FRONT_G_W3',
      kind: 'window',
      levelId: 'ground',
      edge: { ring: 'outer', edgeIndex: 0, fromEnd: true },
      offset: 6.45,
      width: 0.7,
      sillHeight: 1.65,
      height: 0.5,
      style: { variant: 'plain', grid: { cols: 3, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W1',
      kind: 'window',
      levelId: 'first',
      edge: { ring: 'outer', edgeIndex: 7, fromEnd: true },
      offset: 0.55,
      width: 0.9,
      sillHeight: 0.35,
      height: 1.6,
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W2',
      kind: 'window',
      levelId: 'first',
      edge: { ring: 'outer', edgeIndex: 7, fromEnd: true },
      offset: 2.35,
      width: 0.9,
      sillHeight: 0.35,
      height: 1.6,
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W3',
      kind: 'window',
      levelId: 'first',
      edge: { ring: 'outer', edgeIndex: 7, fromEnd: true },
      offset: 4.35,
      width: 0.9,
      sillHeight: 1.1,
      height: 1,
      style: { variant: 'plain', grid: { cols: 3, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W4',
      kind: 'window',
      levelId: 'first',
      edge: { ring: 'outer', edgeIndex: 7, fromEnd: true },
      offset: 6.45,
      width: 0.7,
      sillHeight: 1.05,
      height: 0.9,
      style: { variant: 'plain', grid: { cols: 2, rows: 2 }, hasSill: true, hasLintel: true },
    },
  ],
};
