import { ArchitecturalHouse } from "./architecturalTypes";
import { computeOpeningOffsetsFromChain } from "./geometry/facadeChains";

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
        { x: 4.8, z: 4 },
        { x: 4.8, z: 8.45 },
        { x: 4.8, z: 12 },
      ],
    },
  },
];

// Current envelope orientation has the front facade at z = 0.
const FRONT_FACADE: "minZ" | "maxZ" = "minZ";
const groundFrontEdgeIndex = findFacadeEdgeIndex(levels[0].footprint.outer, FRONT_FACADE);
const firstFrontEdgeIndex = findFacadeEdgeIndex(levels[1].footprint.outer, FRONT_FACADE);
const GROUND_REAR_MAIN_EDGE = 1;
const FIRST_REAR_EDGE = 9;

const groundChain = [1.15, 1.1, 0.7, 1.1, 0.95, 1.0, 1.15, 0.7, 1.75];
const [W1, W2, DOOR, W3] = computeOpeningOffsetsFromChain(groundChain);

const firstChain = [1.25, 0.9, 0.9, 0.9, 1.1, 0.9, 1.2, 0.7, 1.75];
const [FW1, FW2, FW3, FW4] = computeOpeningOffsetsFromChain(firstChain);

// Rear elevations are authored against explicit edge indices because the current
// rear facades are split and a generic "maxZ edge" helper can pick the short stub.
const GROUND_REAR_FULL_WIDTH = 8.3;
const GROUND_REAR_STUB_WIDTH = 0.7;
const GROUND_REAR_OPENING_WIDTH = 5.6;
const GROUND_REAR_OPENING_OFFSET =
  (GROUND_REAR_FULL_WIDTH - GROUND_REAR_OPENING_WIDTH) / 2 - GROUND_REAR_STUB_WIDTH;

// The first-floor rear wall is 8.3m wide, while the elevation drawing is a 7.6m
// composition centered within it, so keep 0.35m of padding on both sides.
const FIRST_REAR_COMPOSITION_PADDING = 0.35;
const FIRST_REAR_WINDOW_WIDTH = 1.1;
const FIRST_REAR_WINDOW_SILL_HEIGHT = 0.35;
const FIRST_REAR_WINDOW_HEIGHT = 1.6;
const FIRST_REAR_LEFT_WINDOW_OFFSET = FIRST_REAR_COMPOSITION_PADDING + 1.7;
const FIRST_REAR_RIGHT_WINDOW_OFFSET =
  FIRST_REAR_COMPOSITION_PADDING + 1.7 + FIRST_REAR_WINDOW_WIDTH + 2.0;

const LEFT_FACADE_GROUND_OPENING_HEIGHT = cm(245);
const LEFT_FACADE_FIRST_OPENING_HEIGHT = cm(195);
const LEFT_FACADE_SHORT_GROUND_OPENING_HEIGHT = cm(215);
const LEFT_FACADE_STACK_WIDTH = cm(70);
// The 4.45m indented side wall carries two narrower stacked bays; keep the offsets
// edge-addressed so both floors stay aligned to that exact facade segment.
const LEFT_FACADE_MID_SEGMENT_WINDOW_CHAIN = [cm(100), LEFT_FACADE_STACK_WIDTH, cm(105), LEFT_FACADE_STACK_WIDTH, cm(100)];
const [leftFacadeMidRearCenter, leftFacadeMidFrontCenter] =
  computeOpeningOffsetsFromChain(LEFT_FACADE_MID_SEGMENT_WINDOW_CHAIN);
const LEFT_FACADE_MID_REAR_OFFSET = leftFacadeMidRearCenter - LEFT_FACADE_STACK_WIDTH / 2;
const LEFT_FACADE_MID_FRONT_OFFSET = leftFacadeMidFrontCenter - LEFT_FACADE_STACK_WIDTH / 2;
// Elevation calibration: the left facade reads closer to a roughly 2/3 lower lite and
// 1/3 transom than an even 50/50 split, so keep the whole family at a 0.66 lower-zone ratio.
const LEFT_FACADE_TRANSOM_RATIO = 0.66;
const LEFT_FACADE_FAMILY_FRAME_THICKNESS = 0.06;
const LEFT_FACADE_FAMILY_MULLION_WIDTH = 0.052;
const LEFT_FACADE_TALL_LOWER_WINDOW_STYLE = {
  variant: 'verticalTransom',
  hasSill: false,
  hasLintel: false,
  grid: { cols: 1, rows: 2 },
  transomRatio: LEFT_FACADE_TRANSOM_RATIO,
  frameThickness: LEFT_FACADE_FAMILY_FRAME_THICKNESS,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
  mullionWidth: LEFT_FACADE_FAMILY_MULLION_WIDTH,
  frameEdges: { top: false },
} as const;
const LEFT_FACADE_TALL_UPPER_WINDOW_STYLE = {
  ...LEFT_FACADE_TALL_LOWER_WINDOW_STYLE,
  hasSill: false,
  hasLintel: true,
  frameEdges: { bottom: false },
} as const;
const LEFT_FACADE_SHORT_WINDOW_STYLE = {
  variant: 'verticalTransom',
  hasSill: false,
  hasLintel: true,
  grid: { cols: 1, rows: 2 },
  transomRatio: LEFT_FACADE_TRANSOM_RATIO,
  frameThickness: LEFT_FACADE_FAMILY_FRAME_THICKNESS,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
  mullionWidth: LEFT_FACADE_FAMILY_MULLION_WIDTH,
} as const;

type LeftFacadeStack = {
  id: 'LOW' | 'MID' | 'HIGH';
  groundEdgeIndex: number;
  firstEdgeIndex: number;
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
        width: LEFT_FACADE_STACK_WIDTH,
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
      width: LEFT_FACADE_STACK_WIDTH,
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
    start: levels[0].footprint.outer[groundFrontEdgeIndex],
    end: levels[0].footprint.outer[(groundFrontEdgeIndex + 1) % levels[0].footprint.outer.length],
  },
  first: {
    edgeIndex: firstFrontEdgeIndex,
    start: levels[1].footprint.outer[firstFrontEdgeIndex],
    end: levels[1].footprint.outer[(firstFrontEdgeIndex + 1) % levels[1].footprint.outer.length],
  },
});

const a = levels[0].footprint.outer[groundFrontEdgeIndex];
const b = levels[0].footprint.outer[(groundFrontEdgeIndex + 1) % levels[0].footprint.outer.length];

console.log("FRONT EDGE DIRECTION", {
  start: a,
  end: b,
  direction: { x: b.x - a.x, z: b.z - a.z },
});

export const architecturalHouse: ArchitecturalHouse = {
  wallThickness: WALL_THICKNESS, // match current

  levels,

  materials: {
    walls: {
      texture: '/textures/brick1.jpg',
      scale: 1,
    },
    windows: {
      frameColor: '#ffffff',
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
      style: { variant: 'classicTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'classicTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'doorDetailed', hasSill: false, hasLintel: true, surroundRing: true },
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
      style: { variant: 'plain', grid: { cols: 3, rows: 3 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'firstFloorTransom', grid: { cols: 2, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W3',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW3,
      width: 0.9,
      sillHeight: 1.1,
      height: 1,
      style: { variant: 'plain', grid: { cols: 3, rows: 3 }, hasSill: true, hasLintel: true },
    },
    {
      id: 'FRONT_F_W4',
      kind: 'window',
      levelId: 'first',
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex },
      offset: FW4,
      width: 0.7,
      sillHeight: 1.05,
      height: 0.9,
      style: { variant: 'plain', grid: { cols: 2, rows: 2 }, hasSill: true, hasLintel: true },
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
      style: { variant: 'plain', grid: { cols: 3, rows: 1 }, hasSill: false, hasLintel: true },
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
    ...LEFT_FACADE_STACKS.flatMap(createLeftFacadeStackOpenings),
  ],
};
