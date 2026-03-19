import { ArchitecturalHouse } from "./architecturalTypes";
import { computeOpeningOffsetsFromChain } from "./geometry/facadeChains";

type XZ = { x: number; z: number };
const EPS = 1e-6;

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

const groundChain = [1.15, 1.1, 0.7, 1.1, 0.95, 1.0, 1.15, 0.7, 1.75];
const [W1, W2, DOOR, W3] = computeOpeningOffsetsFromChain(groundChain);

const firstChain = [1.25, 0.9, 0.9, 0.9, 1.1, 0.9, 1.2, 0.7, 1.75];
const [FW1, FW2, FW3, FW4] = computeOpeningOffsetsFromChain(firstChain);

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
  wallThickness: 0.3, // match current

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
  ],
};
