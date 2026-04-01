import type { ArchitecturalHouse } from "./architecturalTypes";
import { createLeftFacadeStackOpenings, type LeftFacadeStack } from './factories/openingGroups/createLeftFacadeStackOpenings';
import { createOpeningsFromChain } from './factories/openingGroups/createOpeningsFromChain';
import { LOT_1A_FOOTPRINT } from './site/lot1aFootprint';
import { LOT_1A_SITE_LAYOUT, mapSiteLayoutToSurfaces } from './site/lot1aSurfaces';
import {
  doorDetailed,
  firstFloorTransom,
  frontDormerWindow,
  frontFirstTallWindow,
  frontGroundTallWindow,
  frontPortalDoor,
  frontSmallWindow,
  leftFacadeShortWindow,
  leftFacadeTallLowerWindow,
  leftFacadeTallUpperWindow,
  plainWindow,
} from './styles/openingStylePresets';
import { findFacadeEdgeIndex } from './utils/facadeEdgeUtils';
import { cm } from './utils/units';

const GROUND_OUTER = [
  { x: 4.8, z: 15 },
  { x: 4.1, z: 15 },
  { x: -3.5, z: 15 },
  { x: -3.5, z: 12 },
  { x: -3.5, z: 8.45 },
  { x: -4.1, z: 8.45 },
  { x: -4.1, z: 4 },
  { x: -4.8, z: 4 },
  { x: -4.8, z: 0 },
  { x: 4.8, z: 0 },
];

const FIRST_OUTER = [
  { x: -3.5, z: 12 },
  { x: -3.5, z: 8.45 },
  { x: -4.1, z: 8.45 },
  { x: -4.1, z: 4 },
  { x: -4.8, z: 4 },
  { x: -4.8, z: 0 },
  { x: 4.8, z: 0 },
  { x: 4.8, z: 4 },
  { x: 4.8, z: 8.45 },
  { x: 4.8, z: 12 },
];

const groundFrontEdgeIndex = findFacadeEdgeIndex(GROUND_OUTER, 'minZ');
const firstFrontEdgeIndex = findFacadeEdgeIndex(FIRST_OUTER, 'minZ');
const GROUND_REAR_MAIN_EDGE = 1;
const FIRST_REAR_EDGE = 9;

const site: ArchitecturalHouse['site'] = {
  elevation: -0.001,
  color: '#6DAA2C',
  footprint: LOT_1A_FOOTPRINT,
  surfaces: mapSiteLayoutToSurfaces(LOT_1A_SITE_LAYOUT, GROUND_OUTER),
};

const LEFT_FACADE_GROUND_OPENING_HEIGHT = 2.8;
const LEFT_FACADE_FIRST_OPENING_HEIGHT = cm(195);
const LEFT_FACADE_SHORT_GROUND_OPENING_HEIGHT = cm(215);
const FRONT_DORMER_WINDOW_HEIGHT = 1;
const FRONT_DORMER_WINDOW_SILL_HEIGHT = 1.8;

// These three stacks sit on the indented left facade's explicit vertical edge runs.
// Do not replace these with generic minX/left-facade helpers: each stack belongs to
// a different footprint segment and must stay edge-addressed for deterministic derivation.
const LEFT_FACADE_STACKS: readonly LeftFacadeStack[] = [
  {
    id: 'LOW',
    groundEdge: { levelId: 'ground', ring: 'outer', edgeIndex: 2, fromEnd: false },
    firstEdge: { levelId: 'first', ring: 'outer', edgeIndex: 4, fromEnd: false },
    width: cm(70),
    groundHeight: LEFT_FACADE_SHORT_GROUND_OPENING_HEIGHT,
    firstHeight: LEFT_FACADE_FIRST_OPENING_HEIGHT,
    positions: [
      {
        groundOffset: cm(130),
        includeFirst: false,
      },
    ],
  },
  {
    id: 'MID',
    groundEdge: { levelId: 'ground', ring: 'outer', edgeIndex: 5, fromEnd: true },
    firstEdge: { levelId: 'first', ring: 'outer', edgeIndex: 2, fromEnd: true },
    width: cm(80),
    groundHeight: LEFT_FACADE_GROUND_OPENING_HEIGHT,
    firstHeight: LEFT_FACADE_FIRST_OPENING_HEIGHT,
    positions: [
      {
        groundOffset: cm(100),
        includeFirst: true,
      },
      {
        idSuffix: 'B',
        groundOffset: cm(265),
        includeFirst: true,
      },
    ],
  },
  {
    id: 'HIGH',
    groundEdge: { levelId: 'ground', ring: 'outer', edgeIndex: 3, fromEnd: true },
    firstEdge: { levelId: 'first', ring: 'outer', edgeIndex: 0, fromEnd: true },
    width: cm(80),
    groundHeight: LEFT_FACADE_GROUND_OPENING_HEIGHT,
    firstHeight: LEFT_FACADE_FIRST_OPENING_HEIGHT,
    positions: [
      {
        groundOffset: cm(130),
        includeFirst: true,
      },
    ],
  },
] as const;

const RIGHT_FACADE_DOOR_WIDTH = cm(90);
const RIGHT_FACADE_DOOR_HEIGHT = cm(215);
const RIGHT_FACADE_WINDOW_WIDTH = cm(80);
const RIGHT_FACADE_WINDOW_HEIGHT = cm(90);
const RIGHT_FACADE_WINDOW_BOTTOM_Y = cm(410);
const FIRST_FLOOR_ELEVATION = 3.05;
const RIGHT_FACADE_WINDOW_SILL_HEIGHT = RIGHT_FACADE_WINDOW_BOTTOM_Y - FIRST_FLOOR_ELEVATION;

// The ground-floor side-elevation drawing calls out a 215cm-high door, while the
// first-floor plan dimensions the right-side window at 80cm wide with its sill at
// +410cm above grade. Keep both openings on the long, flat right facade run and
// aligned to the same approximate z=5.50m centreline from the front edge.
const RIGHT_FACADE_SHARED_CENTER_Z = 5.5;
const RIGHT_FACADE_DOOR_OFFSET =
  RIGHT_FACADE_SHARED_CENTER_Z - RIGHT_FACADE_DOOR_WIDTH / 2;
const RIGHT_FACADE_FIRST_WINDOW_EDGE_INDEX = 7;
const RIGHT_FACADE_FIRST_WINDOW_EDGE_START_Z = FIRST_OUTER[7].z;
const RIGHT_FACADE_WINDOW_OFFSET =
  RIGHT_FACADE_SHARED_CENTER_Z -
  RIGHT_FACADE_WINDOW_WIDTH / 2 -
  RIGHT_FACADE_FIRST_WINDOW_EDGE_START_Z;

// Model the rear-right exterior basement stair as a deterministic add-on that
// stays edge-addressed to the long right facade run. The plan shows a much
// longer, roomier exterior stair court than the initial placeholder block, so
// keep the lower landing aligned to the new basement door while extending the
// full access well to roughly 6.75m along the facade and widening it slightly.
const BASEMENT_RIGHT_ACCESS_LENGTH = 6.75;
const BASEMENT_RIGHT_ACCESS_OFFSET = 15 - BASEMENT_RIGHT_ACCESS_LENGTH;
const BASEMENT_RIGHT_ACCESS_SIDE_WALL_THICKNESS = 0.2;
const BASEMENT_RIGHT_ACCESS_DOOR_WALL_CLEARANCE = 0.1;
const BASEMENT_RIGHT_ACCESS_LANDING_LENGTH = 1.3;
const BASEMENT_RIGHT_ACCESS_STAIR_RUN = BASEMENT_RIGHT_ACCESS_LENGTH - BASEMENT_RIGHT_ACCESS_LANDING_LENGTH;
const BASEMENT_RIGHT_ACCESS_WELL_WIDTH = 1.8;
const BASEMENT_RIGHT_ACCESS_STEP_COUNT = 17;
const BASEMENT_RIGHT_ACCESS_WALL_HEIGHT = 3.1;
const BASEMENT_RIGHT_ACCESS_DOOR_WIDTH = cm(95);
const BASEMENT_RIGHT_ACCESS_DOOR_HEIGHT = cm(215);
const BASEMENT_RIGHT_ACCESS_GUARD_WALL_HEIGHT = 1;
const BASEMENT_RIGHT_ACCESS_DOOR_OFFSET =
  BASEMENT_RIGHT_ACCESS_OFFSET +
  BASEMENT_RIGHT_ACCESS_SIDE_WALL_THICKNESS +
  BASEMENT_RIGHT_ACCESS_DOOR_WALL_CLEARANCE;

export const LOT_1A_CARPORT: NonNullable<ArchitecturalHouse['auxiliary']>[number] = {
  id: 'carport-main',
  type: 'flat',
  attachedTo: {
    side: 'right',
  },
  footprint: {
    outer: [
      { x: 4.8, z: 0.0 },
      { x: 8.55, z: 0.0 },
      { x: 8.55, z: 15.0 },
      { x: 4.8, z: 15.0 },
    ],
  },
  heightOffsetFromRoof: -0.5,
  thickness: 0.2,
  columns: {
    spacing: 3.0,
    size: 0.15,
    insetFromEdge: 0.1,
    sides: {
      front: false,
      rear: false,
      houseSide: false,
      outerSide: true,
    },
  },
  material: {
    roof: 'flat_roof_dark',
    columns: 'wood_oak_light',
    underside: '/textures/fence/wood.jpg',
  },
};

export const architecturalHouse: ArchitecturalHouse = {
  wallThickness: 0.3,
  levels: [
    {
      id: 'basement',
      name: 'Basement',
      elevation: -3.1,
      height: 2.8,
      slab: { thickness: 0.3, inset: 0 },
      footprint: { outer: GROUND_OUTER },
    },
    {
      id: 'ground',
      name: 'Ground',
      elevation: 0,
      height: 2.8,
      slab: { thickness: 0.3, inset: 0 },
      footprint: { outer: GROUND_OUTER },
    },
    {
      id: 'first',
      name: 'First',
      elevation: 3.05,
      height: 2.8,
      slab: { thickness: 0.25, inset: 0 },
      footprint: { outer: FIRST_OUTER },
    },
  ],
  site,
  rooms: [
    {
      id: 'room-ground-office',
      name: 'Office',
      levelId: 'ground',
      polygon: [
        { x: -4.8, z: 0.0 },
        { x: 0.2, z: 0.0 },
        { x: 0.2, z: 4.0 },
        { x: -4.8, z: 4.0 },
      ],
      edges: [
        { type: 'exterior' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'exterior' },
      ],
    },

    {
      id: 'room-ground-hall',
      name: 'Hall',
      levelId: 'ground',
      polygon: [
        { x: 0.2, z: 0.0 },
        { x: 2.3, z: 0.0 },
        { x: 2.3, z: 4.0 },
        { x: 0.2, z: 4.0 },
      ],
      edges: [
        { type: 'exterior' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
      ],
    },

    {
      id: 'room-ground-wc',
      name: 'WC',
      levelId: 'ground',
      polygon: [
        { x: 2.3, z: 0.0 },
        { x: 4.8, z: 0.0 },
        { x: 4.8, z: 1.8 },
        { x: 2.3, z: 1.8 },
      ],
      edges: [
        { type: 'exterior' },
        { type: 'exterior' },
        { type: 'wall' },
        { type: 'wall' },
      ],
    },

    {
      id: 'room-ground-lounge',
      name: 'Lounge',
      levelId: 'ground',
      polygon: [
        { x: -4.1, z: 4.0 },
        { x: 1.0, z: 4.0 },
        { x: 1.0, z: 8.45 },
        { x: -3.5, z: 8.45 },
        { x: -4.1, z: 8.45 },
      ],
      edges: [
        { type: 'wall' },
        { type: 'wall' },
        { type: 'open' },
        { type: 'exterior' },
        { type: 'exterior' },
      ],
    },

    {
      id: 'room-ground-stairs-core',
      name: 'Stairs Core',
      levelId: 'ground',
      polygon: [
        { x: 1.0, z: 4.0 },
        { x: 2.7, z: 4.0 },
        { x: 2.7, z: 6.2 },
        { x: 1.0, z: 6.2 },
      ],
      edges: [
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
      ],
    },
    {
      id: 'room-ground-storage-entry',
      name: 'Storage',
      levelId: 'ground',
      polygon: [
        { x: 2.3, z: 1.8 },
        { x: 4.8, z: 1.8 },
        { x: 4.8, z: 8.45 },
        { x: 1.0, z: 8.45 },
        { x: 1.0, z: 6.2 },
        { x: 2.7, z: 6.2 },
        { x: 2.7, z: 4.0 },
        { x: 2.3, z: 4.0 },
      ],
      edges: [
        { type: 'wall' },
        { type: 'exterior' },
        { type: 'exterior' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
        { type: 'wall' },
      ],
    },
    {
      id: 'room-ground-kitchen',
      name: 'Kitchen',
      levelId: 'ground',
      polygon: [
        { x: -3.5, z: 8.45 },
        { x: 4.8, z: 8.45 },
        { x: 4.8, z: 11.6 },
        { x: -3.5, z: 11.6 },
      ],
      edges: [
        { type: 'open' },
        { type: 'exterior' },
        { type: 'wall' },
        { type: 'exterior' },
      ],
    },

    {
      id: 'room-ground-dining',
      name: 'Dining',
      levelId: 'ground',
      polygon: [
        { x: -3.5, z: 11.6 },
        { x: 4.8, z: 11.6 },
        { x: 4.8, z: 15.0 },
        { x: -3.5, z: 15.0 },
      ],
      edges: [
        { type: 'wall' },
        { type: 'exterior' },
        { type: 'exterior' },
        { type: 'exterior' },
      ],
    },
  ],


  materials: {
    walls: {
      texture: '/textures/brick1.jpg',
      scale: 1,
      interiorColor: '#f6f1e7',
    },
    windows: {
      frameColor: '#383e42',
      glassColor: '#a8d0ff',
      glassOpacity: 0.35,
    },
    roof: {
      color: '#333333',
    },
  },

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
      overhang: 0,
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

  auxiliary: [LOT_1A_CARPORT],

  openings: [
    ...createOpeningsFromChain({
      chain: [1.15, 1.1, 0.7, 1.1, 0.95, 1.0, 1.15, 0.7, 1.75],
      openings: [
        {
          id: 'FRONT_G_W1',
          kind: 'window',
          levelId: 'ground',
          edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
          width: 1.1,
          sillHeight: 0.7,
          height: 1.6,
          style: frontGroundTallWindow,
        },
        {
          id: 'FRONT_G_W2',
          kind: 'window',
          levelId: 'ground',
          edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
          width: 1.1,
          sillHeight: 0.7,
          height: 1.6,
          style: frontGroundTallWindow,
        },
        {
          id: 'FRONT_G_DOOR',
          kind: 'door',
          levelId: 'ground',
          edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
          width: 1,
          sillHeight: 0,
          height: 2.5,
          style: frontPortalDoor,
        },
        {
          id: 'FRONT_G_W3',
          kind: 'window',
          levelId: 'ground',
          edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
          width: 0.7,
          sillHeight: 1.65,
          height: 0.5,
          style: frontSmallWindow,
        },
      ],
    }),
    ...createOpeningsFromChain({
      chain: [1.25, 0.9, 0.9, 0.9, 1.1, 0.9, 1.2, 0.7, 1.75],
      openings: [
        {
          id: 'FRONT_F_W1',
          kind: 'window',
          levelId: 'first',
          edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
          width: 0.9,
          sillHeight: 0.35,
          height: 1.6,
          style: frontFirstTallWindow,
        },
        {
          id: 'FRONT_F_W2',
          kind: 'window',
          levelId: 'first',
          edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
          width: 0.9,
          sillHeight: 0.35,
          height: 1.6,
          style: frontFirstTallWindow,
        },
        {
          id: 'FRONT_F_W3',
          kind: 'window',
          levelId: 'first',
          edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
          width: 0.9,
          sillHeight: FRONT_DORMER_WINDOW_SILL_HEIGHT,
          height: FRONT_DORMER_WINDOW_HEIGHT,
          style: frontDormerWindow,
        },
        {
          id: 'FRONT_F_W4',
          kind: 'window',
          levelId: 'first',
          edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
          width: 0.7,
          sillHeight: 1.3,
          height: 0.9,
          style: frontSmallWindow,
        },
      ],
    }),
    {
      id: 'REAR_G_GLAZED',
      kind: 'window',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: GROUND_REAR_MAIN_EDGE },
      offset: 1,
      width: 5.6,
      sillHeight: 0,
      height: 2.45,
      style: {
        variant: 'plain',
        grid: { cols: 3, rows: 1 },
        hasSill: true,
        sillDepth: 0.12,
        sillThickness: 0.03,
        hasLintel: true,
      },
    },
    {
      id: 'REAR_F_W_LEFT',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: FIRST_REAR_EDGE, fromEnd: true },
      offset: 2.05,
      width: 1.1,
      sillHeight: 0.35,
      height: 1.6,
      style: firstFloorTransom,
    },
    {
      id: 'REAR_F_W_RIGHT',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: FIRST_REAR_EDGE, fromEnd: true },
      offset: 5.15,
      width: 1.1,
      sillHeight: 0.35,
      height: 1.6,
      style: firstFloorTransom,
    },
    {
      id: 'RIGHT_G_DOOR',
      kind: 'door',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: 9 },
      offset: RIGHT_FACADE_DOOR_OFFSET,
      width: RIGHT_FACADE_DOOR_WIDTH,
      sillHeight: 0,
      height: RIGHT_FACADE_DOOR_HEIGHT,
      style: doorDetailed,
    },
    {
      id: 'RIGHT_B_BASEMENT_DOOR',
      kind: 'door',
      levelId: 'basement',
      edge: { levelId: 'basement', ring: 'outer', edgeIndex: 9 },
      offset: BASEMENT_RIGHT_ACCESS_DOOR_OFFSET,
      width: BASEMENT_RIGHT_ACCESS_DOOR_WIDTH,
      sillHeight: 0,
      height: BASEMENT_RIGHT_ACCESS_DOOR_HEIGHT,
      style: doorDetailed,
    },
    {
      id: 'RIGHT_F_WINDOW',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: RIGHT_FACADE_FIRST_WINDOW_EDGE_INDEX },
      offset: RIGHT_FACADE_WINDOW_OFFSET,
      width: RIGHT_FACADE_WINDOW_WIDTH,
      sillHeight: RIGHT_FACADE_WINDOW_SILL_HEIGHT,
      height: RIGHT_FACADE_WINDOW_HEIGHT,
      style: plainWindow,
    },
    ...createLeftFacadeStackOpenings(LEFT_FACADE_STACKS, {
      lowerTall: leftFacadeTallLowerWindow,
      upperTall: leftFacadeTallUpperWindow,
      short: leftFacadeShortWindow,
    }),
  ],

  exteriorAccesses: [
    {
      id: 'BASEMENT_RIGHT_REAR_ACCESS',
      levelId: 'basement',
      edge: { levelId: 'basement', ring: 'outer', edgeIndex: 9 },
      offset: BASEMENT_RIGHT_ACCESS_OFFSET,
      wellWidth: BASEMENT_RIGHT_ACCESS_WELL_WIDTH,
      landingLength: BASEMENT_RIGHT_ACCESS_LANDING_LENGTH,
      stairRun: BASEMENT_RIGHT_ACCESS_STAIR_RUN,
      stairRise: BASEMENT_RIGHT_ACCESS_WALL_HEIGHT,
      stepCount: BASEMENT_RIGHT_ACCESS_STEP_COUNT,
      floorThickness: 0.18,
      wallThickness: BASEMENT_RIGHT_ACCESS_SIDE_WALL_THICKNESS,
      wallHeight: BASEMENT_RIGHT_ACCESS_WALL_HEIGHT,
      guardWallHeight: BASEMENT_RIGHT_ACCESS_GUARD_WALL_HEIGHT,
    },
  ],
};
