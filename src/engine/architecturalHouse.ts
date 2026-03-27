import type { OpeningStyleSpec } from './architecturalTypes';
import { ArchitecturalHouse } from "./architecturalTypes";
import { computeOpeningOffsetsFromChain } from "./geometry/facadeChains";
import { LOT_1A_FOOTPRINT } from './site/lot1aFootprint';
import { LOT_1A_SITE_LAYOUT, mapSiteLayoutToSurfaces } from './site/lot1aSurfaces';

type XZ = { x: number; z: number };
const EPS = 1e-6;
const WALL_THICKNESS = 0.3;
const MAIN_ROOF_OVERHANG = 0;

/**
 * Removes duplicated closing vertex if present.
 */
function openRing(ring: XZ[]): XZ[] {
  if (ring.length < 2) return ring;

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (Math.abs(first.x - last.x) < EPS && Math.abs(first.z - last.z) < EPS) {
    return ring.slice(0, -1);
  }

  return ring;
}

/**
 * Returns the edge index whose two vertices both lie on zTarget.
 */
function findEdgeIndexAtZ(ring: XZ[], zTarget: number, eps = EPS): number | null {
  const r = openRing(ring);
  const n = r.length;

  for (let i = 0; i < n; i++) {
    const a = r[i];
    const b = r[(i + 1) % n];

    if (Math.abs(a.z - zTarget) < eps && Math.abs(b.z - zTarget) < eps) {
      return i;
    }
  }

  return null;
}

const cm = (value: number) => value / 100;

/**
 * Finds facade edge index at either minZ or maxZ.
 * Throws if not found.
 */
export function findFacadeEdgeIndex(ring: XZ[], which: "minZ" | "maxZ"): number {
  const r = openRing(ring);

  if (r.length < 2) {
    throw new Error('findFacadeEdgeIndex: ring has fewer than 2 vertices');
  }

  const zs = r.map((point) => point.z);
  const zTarget = which === "minZ" ? Math.min(...zs) : Math.max(...zs);

  const idx = findEdgeIndexAtZ(r, zTarget);

  if (idx == null) {
    throw new Error(`findFacadeEdgeIndex: No horizontal edge found at ${which} (z=${zTarget})`);
  }

  return idx;
}

/**
 * This mirrors the current house geometry but expressed
 * as architectural intent instead of derived geometry.
 */
const groundLevel: ArchitecturalHouse['levels'][number] = {
  id: "ground",
  elevation: 0,
  height: 2.8,
  slab: {
    thickness: 0.3,
    inset: 0,
  },
  footprint: {
    outer: [
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
    ],
  },
};

const basementLevel: ArchitecturalHouse['levels'][number] = {
  id: "basement",
  elevation: groundLevel.elevation - groundLevel.slab.thickness - groundLevel.height,
  height: groundLevel.height,
  slab: {
    thickness: groundLevel.slab.thickness,
    inset: groundLevel.slab.inset,
  },
  footprint: {
    outer: groundLevel.footprint.outer.map((point) => ({ ...point })),
  },
};

const firstLevel: ArchitecturalHouse['levels'][number] = {
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
      { x: 4.8, z: 4 },
      { x: 4.8, z: 8.45 },
      { x: 4.8, z: 12 },
    ],
  },
};

const levels: ArchitecturalHouse['levels'] = [basementLevel, groundLevel, firstLevel];

// Current envelope orientation has the front facade at z = 0.
const FRONT_FACADE: "minZ" | "maxZ" = "minZ";
const groundFrontEdgeIndex = findFacadeEdgeIndex(groundLevel.footprint.outer, FRONT_FACADE);
const firstFrontEdgeIndex = findFacadeEdgeIndex(firstLevel.footprint.outer, FRONT_FACADE);
const GROUND_REAR_MAIN_EDGE = 1;
const FIRST_REAR_EDGE = 9;

const groundChain = [1.15, 1.1, 0.7, 1.1, 0.95, 1.0, 1.15, 0.7, 1.75];
const [W1, W2, DOOR, W3] = computeOpeningOffsetsFromChain(groundChain);

const site: ArchitecturalHouse['site'] = {
  elevation: -0.001,
  color: '#6DAA2C',
  footprint: LOT_1A_FOOTPRINT,
  surfaces: mapSiteLayoutToSurfaces(LOT_1A_SITE_LAYOUT, groundLevel.footprint.outer),
};

const firstChain = [1.25, 0.9, 0.9, 0.9, 1.1, 0.9, 1.2, 0.7, 1.75];
const [FW1, FW2, FW3, FW4] = computeOpeningOffsetsFromChain(firstChain);

// Rear elevations are authored against explicit edge indices because the current
// rear facades are split and a generic "maxZ edge" helper can pick the short stub.
// The ground-floor plan dimensions the glazed rear opening on the 7.60m main rear
// wall with 1.00m side returns on both sides, so center it on that wall segment
// instead of across the full 8.30m stepped outline.
const GROUND_REAR_MAIN_EDGE_WIDTH = 7.6;
const GROUND_REAR_OPENING_WIDTH = 5.6;
const GROUND_REAR_OPENING_OFFSET =
  (GROUND_REAR_MAIN_EDGE_WIDTH - GROUND_REAR_OPENING_WIDTH) / 2;
const GROUND_REAR_THRESHOLD_DEPTH = 0.12;
const GROUND_REAR_THRESHOLD_THICKNESS = 0.03;

// The first-floor rear wall is 8.3m wide, while the elevation drawing is a 7.6m
// composition centered within it, so keep 0.35m of padding on both sides.
const FIRST_REAR_COMPOSITION_PADDING = 0.35;
const FIRST_REAR_WINDOW_WIDTH = 1.1;
const FIRST_REAR_WINDOW_SILL_HEIGHT = 0.35;
const FIRST_REAR_WINDOW_HEIGHT = 1.6;
const FIRST_REAR_LEFT_WINDOW_OFFSET = FIRST_REAR_COMPOSITION_PADDING + 1.7;
const FIRST_REAR_RIGHT_WINDOW_OFFSET =
  FIRST_REAR_COMPOSITION_PADDING + 1.7 + FIRST_REAR_WINDOW_WIDTH + 2.0;

// Keep the stacked left-facade ground-floor glazing running all the way up to
// the underside of the first-floor slab so the lower opening meets the slab
// line instead of stopping short with an exterior wall strip above it.
const LEFT_FACADE_GROUND_OPENING_HEIGHT = firstLevel.elevation - firstLevel.slab.thickness;
const LEFT_FACADE_FIRST_OPENING_HEIGHT = cm(195);
const LEFT_FACADE_SHORT_GROUND_OPENING_HEIGHT = cm(215);
const LEFT_FACADE_LOW_STACK_WIDTH = cm(70);
const LEFT_FACADE_TALL_STACK_WIDTH = cm(80);
// Drawing callouts show the lower return opening at 70cm wide and the taller
// left-facade stacks at 80cm wide. Keep the long 4.45m side run edge-addressed so
// both floors stay aligned to the explicit facade segment.
const LEFT_FACADE_MID_SEGMENT_WINDOW_CHAIN = [
  cm(100),
  LEFT_FACADE_TALL_STACK_WIDTH,
  cm(85),
  LEFT_FACADE_TALL_STACK_WIDTH,
  cm(100),
];
const [leftFacadeMidRearCenter, leftFacadeMidFrontCenter] =
  computeOpeningOffsetsFromChain(LEFT_FACADE_MID_SEGMENT_WINDOW_CHAIN);
const LEFT_FACADE_MID_REAR_OFFSET = leftFacadeMidRearCenter - LEFT_FACADE_TALL_STACK_WIDTH / 2;
const LEFT_FACADE_MID_FRONT_OFFSET = leftFacadeMidFrontCenter - LEFT_FACADE_TALL_STACK_WIDTH / 2;
const LEFT_FACADE_FAMILY_FRAME_THICKNESS = 0.06;
const LEFT_FACADE_TALL_LOWER_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'plain',
  hasSill: true,
  hasLintel: false,
  frameThickness: LEFT_FACADE_FAMILY_FRAME_THICKNESS,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
  frameEdges: { top: false },
};
const LEFT_FACADE_TALL_UPPER_WINDOW_STYLE: OpeningStyleSpec = {
  ...LEFT_FACADE_TALL_LOWER_WINDOW_STYLE,
  hasSill: false,
  hasLintel: true,
  mergeWithBelow: true,
  separatorPanelHeight: firstLevel.slab.thickness,
  frameEdges: { bottom: false },
};
const LEFT_FACADE_SHORT_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'plain',
  hasSill: true,
  hasLintel: true,
  frameThickness: LEFT_FACADE_FAMILY_FRAME_THICKNESS,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
};

const FRONT_GROUND_TALL_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'planFrontWindow',
  grid: { cols: 2, rows: 4 },
  rowFractions: [0.2, 0.266, 0.266, 0.268],
  hasSill: true,
  hasLintel: true,
};

const FRONT_FIRST_TALL_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'firstFloorTransom',
  grid: { cols: 2, rows: 4 },
  rowFractions: [0.2, 0.266, 0.266, 0.268],
  hasSill: true,
  hasLintel: true,
};

const FRONT_DORMER_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'plain',
  grid: { cols: 2, rows: 3 },
  rowFractions: [0.28, 0.36, 0.36],
  frameThickness: 0.09,
  frameDepth: 0.14,
  glassInset: 0.01,
  glassThickness: 0.012,
  mullionWidth: 0.055,
  hasSill: false,
  hasLintel: false,
};

const FRONT_DORMER_WINDOW_HEIGHT = 1;
const FRONT_DORMER_WINDOW_SILL_HEIGHT = firstLevel.height - FRONT_DORMER_WINDOW_HEIGHT;

const FRONT_SMALL_WINDOW_STYLE: OpeningStyleSpec = {
  variant: 'plain',
  grid: { cols: 2, rows: 3 },
  rowFractions: [0.28, 0.36, 0.36],
  hasSill: true,
  hasLintel: true,
};

type LeftFacadeStack = {
  id: 'LOW' | 'MID' | 'HIGH';
  groundEdgeIndex: number;
  firstEdgeIndex: number;
  width: number;
  groundFromEnd: boolean;
  firstFromEnd?: boolean;
  groundHeight: number;
  positions: readonly {
    idSuffix?: string;
    groundOffset: number;
    firstOffset?: number;
    includeFirst: boolean;
  }[];
};

// These three stacks sit on the indented left facade's explicit vertical edge runs.
// Do not replace these with generic minX/left-facade helpers: each stack belongs to
// a different footprint segment and must stay edge-addressed for deterministic derivation.
const LEFT_FACADE_STACKS: readonly LeftFacadeStack[] = [
  {
    id: 'LOW',
    groundEdgeIndex: 2,
    firstEdgeIndex: 4,
    width: LEFT_FACADE_LOW_STACK_WIDTH,
    groundFromEnd: false,
    groundHeight: LEFT_FACADE_SHORT_GROUND_OPENING_HEIGHT,
    positions: [
      {
        groundOffset: cm(130),
        includeFirst: false,
      },
    ],
  },
  {
    id: 'MID',
    groundEdgeIndex: 5,
    firstEdgeIndex: 2,
    width: LEFT_FACADE_TALL_STACK_WIDTH,
    groundFromEnd: true,
    groundHeight: LEFT_FACADE_GROUND_OPENING_HEIGHT,
    positions: [
      {
        groundOffset: LEFT_FACADE_MID_REAR_OFFSET,
        includeFirst: true,
      },
      {
        idSuffix: 'B',
        groundOffset: LEFT_FACADE_MID_FRONT_OFFSET,
        includeFirst: true,
      },
    ],
  },
  {
    id: 'HIGH',
    groundEdgeIndex: 3,
    firstEdgeIndex: 0,
    width: LEFT_FACADE_TALL_STACK_WIDTH,
    groundFromEnd: true,
    groundHeight: LEFT_FACADE_GROUND_OPENING_HEIGHT,
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
const FIRST_FLOOR_ELEVATION = levels.find((level) => level.id === 'first')?.elevation ?? 0;
const RIGHT_FACADE_WINDOW_SILL_HEIGHT = RIGHT_FACADE_WINDOW_BOTTOM_Y - FIRST_FLOOR_ELEVATION;

// The ground-floor side-elevation drawing calls out a 215cm-high door, while the
// first-floor plan dimensions the right-side window at 80cm wide with its sill at
// +410cm above grade. Keep both openings on the long, flat right facade run and
// aligned to the same approximate z=5.50m centreline from the front edge.
const RIGHT_FACADE_SHARED_CENTER_Z = 5.5;
const RIGHT_FACADE_DOOR_OFFSET =
  RIGHT_FACADE_SHARED_CENTER_Z - RIGHT_FACADE_DOOR_WIDTH / 2;
const RIGHT_FACADE_FIRST_WINDOW_EDGE_INDEX = 7;
const RIGHT_FACADE_FIRST_WINDOW_EDGE_START_Z = firstLevel.footprint.outer[7].z;
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
const BASEMENT_RIGHT_ACCESS_WALL_HEIGHT = groundLevel.elevation - basementLevel.elevation;
const BASEMENT_RIGHT_ACCESS_DOOR_WIDTH = cm(95);
const BASEMENT_RIGHT_ACCESS_DOOR_HEIGHT = cm(215);
const BASEMENT_RIGHT_ACCESS_GUARD_WALL_HEIGHT = 1;
const BASEMENT_RIGHT_ACCESS_DOOR_OFFSET =
  BASEMENT_RIGHT_ACCESS_OFFSET +
  BASEMENT_RIGHT_ACCESS_SIDE_WALL_THICKNESS +
  BASEMENT_RIGHT_ACCESS_DOOR_WALL_CLEARANCE;

function createLeftFacadeStackOpenings(stack: LeftFacadeStack) {
  return stack.positions.flatMap((position) => {
    const idSuffix = position.idSuffix ? `_${position.idSuffix}` : '';
    const openings = [
      {
        id: `LEFT_STACK_${stack.id}${idSuffix}_G`,
        kind: 'window' as const,
        levelId: 'ground',
        edge: {
          levelId: 'ground',
          ring: 'outer' as const,
          edgeIndex: stack.groundEdgeIndex,
          fromEnd: stack.groundFromEnd,
        },
        offset: position.groundOffset,
        width: stack.width,
        sillHeight: 0,
        height: stack.groundHeight,
        style: position.includeFirst ? LEFT_FACADE_TALL_LOWER_WINDOW_STYLE : LEFT_FACADE_SHORT_WINDOW_STYLE,
      },
    ];

    if (!position.includeFirst) {
      return openings;
    }

    openings.push({
      id: `LEFT_STACK_${stack.id}${idSuffix}_F`,
      kind: 'window' as const,
      levelId: 'first',
      edge: {
        levelId: 'first',
        ring: 'outer' as const,
        edgeIndex: stack.firstEdgeIndex,
        fromEnd: stack.firstFromEnd ?? stack.groundFromEnd,
      },
      offset: position.firstOffset ?? position.groundOffset,
      width: stack.width,
      sillHeight: 0,
      height: LEFT_FACADE_FIRST_OPENING_HEIGHT,
      style: LEFT_FACADE_TALL_UPPER_WINDOW_STYLE,
    });

    return openings;
  });
}

console.log("FRONT EDGE CHECK", {
  frontFacade: FRONT_FACADE,
  ground: {
    edgeIndex: groundFrontEdgeIndex,
    start: groundLevel.footprint.outer[groundFrontEdgeIndex],
    end: groundLevel.footprint.outer[(groundFrontEdgeIndex + 1) % groundLevel.footprint.outer.length],
  },
  first: {
    edgeIndex: firstFrontEdgeIndex,
    start: firstLevel.footprint.outer[firstFrontEdgeIndex],
    end: firstLevel.footprint.outer[(firstFrontEdgeIndex + 1) % firstLevel.footprint.outer.length],
  },
});

const a = groundLevel.footprint.outer[groundFrontEdgeIndex];
const b = groundLevel.footprint.outer[(groundFrontEdgeIndex + 1) % groundLevel.footprint.outer.length];

console.log("FRONT EDGE DIRECTION", {
  start: a,
  end: b,
  direction: { x: b.x - a.x, z: b.z - a.z },
});

export const LOT_1A_CARPORT: ArchitecturalHouse['auxiliary'][number] = {
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
      back: false,
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
  wallThickness: WALL_THICKNESS, // match current

  levels,
  site,
  rooms: [
    {
      id: 'room-ground-entry',
      name: 'Entry',
      levelId: 'ground',
      polygon: [
        { x: -3.2, z: 0.6 },
        { x: -1.0, z: 0.6 },
        { x: -1.0, z: 3.0 },
        { x: -3.2, z: 3.0 },
      ],
      edges: [{ type: 'wall' }, { type: 'open' }, { type: 'wall' }, { type: 'wall' }],
    },
    {
      id: 'room-ground-living',
      name: 'Living',
      levelId: 'ground',
      polygon: [
        { x: -0.8, z: 0.6 },
        { x: 4.2, z: 0.6 },
        { x: 4.2, z: 6.4 },
        { x: -0.8, z: 6.4 },
      ],
      edges: [{ type: 'wall' }, { type: 'wall' }, { type: 'open' }, { type: 'open' }],
    },
    {
      id: 'room-ground-kitchen',
      name: 'Kitchen',
      levelId: 'ground',
      polygon: [
        { x: -3.2, z: 3.4 },
        { x: -0.8, z: 3.4 },
        { x: -0.8, z: 7.8 },
        { x: -3.2, z: 7.8 },
      ],
      edges: [{ type: 'wall' }, { type: 'open' }, { type: 'wall' }, { type: 'wall' }],
    },
  ],
  rooms: [
    {
      id: 'room-ground-entry',
      name: 'Entry',
      levelId: 'ground',
      polygon: [
        { x: -3.2, z: 0.6 },
        { x: -1.0, z: 0.6 },
        { x: -1.0, z: 3.0 },
        { x: -3.2, z: 3.0 },
      ],
      edges: [{ type: 'wall' }, { type: 'open' }, { type: 'wall' }, { type: 'wall' }],
    },
    {
      id: 'room-ground-living',
      name: 'Living',
      levelId: 'ground',
      polygon: [
        { x: -0.8, z: 0.6 },
        { x: 4.2, z: 0.6 },
        { x: 4.2, z: 6.4 },
        { x: -0.8, z: 6.4 },
      ],
      edges: [{ type: 'wall' }, { type: 'wall' }, { type: 'open' }, { type: 'open' }],
    },
    {
      id: 'room-ground-kitchen',
      name: 'Kitchen',
      levelId: 'ground',
      polygon: [
        { x: -3.2, z: 3.4 },
        { x: -0.8, z: 3.4 },
        { x: -0.8, z: 7.8 },
        { x: -3.2, z: 7.8 },
      ],
      edges: [{ type: 'wall' }, { type: 'open' }, { type: 'wall' }, { type: 'wall' }],
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
      overhang: MAIN_ROOF_OVERHANG,
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
    {
      id: 'FRONT_G_W1',
      kind: 'window',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
      offset: W1,
      width: 1.1,
      sillHeight: 0.7,
      height: 1.6,
      style: FRONT_GROUND_TALL_WINDOW_STYLE,
    },
    {
      id: 'FRONT_G_W2',
      kind: 'window',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
      offset: W2,
      width: 1.1,
      sillHeight: 0.7,
      height: 1.6,
      style: FRONT_GROUND_TALL_WINDOW_STYLE,
    },
    {
      id: 'FRONT_G_DOOR',
      kind: 'door',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
      offset: DOOR,
      width: 1,
      sillHeight: 0,
      height: 2.5,
      style: {
        variant: 'frontPortalDoor',
        frameThickness: 0.065,
        frameDepth: 0.14,
        transomRatio: 0.25,
        hasSill: false,
        hasLintel: false,
        surroundRing: true,
      },
    },
    {
      id: 'FRONT_G_W3',
      kind: 'window',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex },
      offset: W3,
      width: 0.7,
      sillHeight: 1.65,
      height: 0.5,
      style: FRONT_SMALL_WINDOW_STYLE,
    },
    {
      id: 'FRONT_F_W1',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW1,
      width: 0.9,
      sillHeight: 0.35,
      height: 1.6,
      style: FRONT_FIRST_TALL_WINDOW_STYLE,
    },
    {
      id: 'FRONT_F_W2',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW2,
      width: 0.9,
      sillHeight: 0.35,
      height: 1.6,
      style: FRONT_FIRST_TALL_WINDOW_STYLE,
    },
    {
      id: 'FRONT_F_W3',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW3,
      width: 0.9,
      sillHeight: FRONT_DORMER_WINDOW_SILL_HEIGHT,
      height: FRONT_DORMER_WINDOW_HEIGHT,
      style: FRONT_DORMER_WINDOW_STYLE,
    },
    {
      id: 'FRONT_F_W4',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW4,
      width: 0.7,
      sillHeight: 1.3,
      height: 0.9,
      style: FRONT_SMALL_WINDOW_STYLE,
    },
    {
      id: 'REAR_G_GLAZED',
      kind: 'window',
      levelId: 'ground',
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: GROUND_REAR_MAIN_EDGE },
      offset: GROUND_REAR_OPENING_OFFSET,
      width: GROUND_REAR_OPENING_WIDTH,
      sillHeight: 0,
      height: 2.45,
      style: {
        variant: 'plain',
        grid: { cols: 3, rows: 1 },
        hasSill: true,
        sillDepth: GROUND_REAR_THRESHOLD_DEPTH,
        sillThickness: GROUND_REAR_THRESHOLD_THICKNESS,
        hasLintel: true,
      },
    },
    {
      id: 'REAR_F_W_LEFT',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: FIRST_REAR_EDGE, fromEnd: true },
      offset: FIRST_REAR_LEFT_WINDOW_OFFSET,
      width: FIRST_REAR_WINDOW_WIDTH,
      sillHeight: FIRST_REAR_WINDOW_SILL_HEIGHT,
      height: FIRST_REAR_WINDOW_HEIGHT,
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 1 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'REAR_F_W_RIGHT',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: FIRST_REAR_EDGE, fromEnd: true },
      offset: FIRST_REAR_RIGHT_WINDOW_OFFSET,
      width: FIRST_REAR_WINDOW_WIDTH,
      sillHeight: FIRST_REAR_WINDOW_SILL_HEIGHT,
      height: FIRST_REAR_WINDOW_HEIGHT,
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 1 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'doorDetailed', hasSill: false, hasLintel: true, surroundRing: true },
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
      style: { variant: 'doorDetailed', hasSill: false, hasLintel: true, surroundRing: true },
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
      style: { variant: 'plain', grid: { cols: 1, rows: 1 }, hasSill: true, hasLintel: true },
    },
    ...LEFT_FACADE_STACKS.flatMap(createLeftFacadeStackOpenings),
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
