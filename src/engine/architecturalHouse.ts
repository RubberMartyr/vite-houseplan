import { ArchitecturalHouse } from "./architecturalTypes";

type XZ = { x: number; z: number };

function openRing(ring: XZ[]) {
  if (ring.length >= 2) {
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.z - b.z) < 1e-9) return ring.slice(0, -1);
  }
  return ring;
}

function findEdgeIndexAtZ(ring: XZ[], zTarget: number, eps = 1e-6) {
  const r = openRing(ring);
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    if (Math.abs(a.z - zTarget) < eps && Math.abs(b.z - zTarget) < eps) return i;
  }
  return null;
}

function findFacadeEdgeIndex(ring: XZ[], which: "minZ" | "maxZ") {
  const r = openRing(ring);
  const zs = r.map((point) => point.z);
  const zTarget = which === "minZ" ? Math.min(...zs) : Math.max(...zs);
  const idx = findEdgeIndexAtZ(r, zTarget);
  if (idx == null) throw new Error(`No edge found at ${which}=${zTarget}`);
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

// Current envelope orientation has the front facade at z = 0.
const FRONT_FACADE: "minZ" | "maxZ" = "minZ";
const groundFrontEdgeIndex = findFacadeEdgeIndex(levels[0].footprint.outer, FRONT_FACADE);
const firstFrontEdgeIndex = findFacadeEdgeIndex(levels[1].footprint.outer, FRONT_FACADE);

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
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'ground', ring: 'outer', edgeIndex: groundFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex, fromEnd: true },
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
      edge: { levelId: 'first', ring: 'outer', edgeIndex: firstFrontEdgeIndex, fromEnd: true },
      offset: 6.45,
      width: 0.7,
      sillHeight: 1.05,
      height: 0.9,
      style: { variant: 'plain', grid: { cols: 2, rows: 2 }, hasSill: true, hasLintel: true },
    },
  ],
};
