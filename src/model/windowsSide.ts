import * as THREE from 'three';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import { getEnvelopeOuterPolygon } from './envelope';
import { EPS, FRAME_BORDER, FRAME_DEPTH, GLASS_INSET, GLASS_THICKNESS } from './constants/windowConstants';
import { buildFrameGeometry } from './builders/buildFrameGeometry';
import { buildSill } from './builders/buildSill';
import { frameMaterial, glassMaterial, metalBandMaterial, revealMaterial } from './materials/windowMaterials';

type SideWindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

export type SideWindowSpec = {
  id: string;
  kind: 'small' | 'tall';
  type?: 'small' | 'tall';
  zCenter: number;
  width: number;
  groundY0: number;
  groundY1: number;
  firstY0: number;
  firstY1: number;
};

const METAL_BAND_DEPTH = 0.02;
const METAL_BAND_HEIGHT = 0.12;
const METAL_BAND_OUTSET = 0.015;
const REVEAL_FACE = 0.05;
export const TALL_Z_OFFSET_TO_FRONT = 0.70; // meters

function windowVerticalExtents(spec: SideWindowSpec) {
  const yBottom = spec.groundY0;
  const yTop = spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) : spec.groundY1;

  return {
    yBottom,
    height: yTop - yBottom,
  };
}

// NOTE: Positive X = architectural LEFT facade (mirrored from source).
//       Negative X = architectural RIGHT facade.
export const RIGHT_FACADE_SEGMENTS = [
  { id: 'R_A', z0: 0.0, z1: 4.0, x: 4.8 },
  { id: 'R_B', z0: 4.0, z1: 8.45, x: 4.1 },
  { id: 'R_C', z0: 8.45, z1: 12.0, x: 3.5 },
] as const;

// Architectural RIGHT facade (negative X world space).
export const LEFT_FACADE_SEGMENTS = [
  { id: 'L_A', z0: 0.0,  z1: 4.0,  x: -4.8 },
  { id: 'L_B', z0: 4.0,  z1: 8.45, x: -4.1 },
  { id: 'L_C', z0: 8.45, z1: 12.0, x: -3.5 },
] as const;

function xFaceForRightAtZ(z: number) {
  if (z <= RIGHT_FACADE_SEGMENTS[0].z1) return RIGHT_FACADE_SEGMENTS[0].x;
  if (z <= RIGHT_FACADE_SEGMENTS[1].z1) return RIGHT_FACADE_SEGMENTS[1].x;
  return RIGHT_FACADE_SEGMENTS[2].x;
}

// Toggle which facade hosts the side windows and whether they should mirror along Z
export const SIDE: 'left' | 'right' = 'right';
export const MIRROR_Z = true;

const metalSlateMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

export const sideWindowSpecs: SideWindowSpec[] = [
  {
    id: 'SIDE_L_EXT',
    kind: 'small',
    zCenter: 1.2,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0.0,
    firstY1: 0.0,
  },
  {
    id: 'SIDE_L_TALL_1',
    kind: 'tall',
    zCenter: 4.6,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_2',
    kind: 'tall',
    zCenter: 6.8,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_3',
    kind: 'tall',
    zCenter: 9.35,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
];

// Windows on the architectural RIGHT facade (negative X world space).
// zCenter values are direct world-space Z — no mirrorZ applied.
export const rightSideWindowSpecs: SideWindowSpec[] = [
  {
    // Ground-floor door (rendered as full-glass window)
    id: 'SIDE_R_DOOR',
    kind: 'small',
    zCenter: 5.5,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0.0,
    firstY1: 0.0,
  },
  {
    // First-floor window: absolute world Y 4.1 → 5.0 m
    // kind:'tall' so windowVerticalExtents picks up firstY1 for height
    id: 'SIDE_R_WIN',
    kind: 'tall',
    zCenter: 5.5,
    width: 0.9,
    groundY0: 4.1,  // yBottom = groundY0 (bottom of window in world Y)
    groundY1: 4.1,  // equal to groundY0 so no ground-floor glass renders
    firstY0: 4.1,
    firstY1: 5.0,
  },
];

function createGlassGeometry(width: number, height: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
}

function createRevealMeshes({
  spec,
  zCenter,
  xOuter,
  xInner,
}: {
  spec: SideWindowSpec;
  zCenter: number;
  xOuter: number;
  xInner: number;
}): SideWindowMesh[] {
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const revealDepth = Math.abs(xOuter - xInner);
  const xMid = (xOuter + xInner) / 2;
  const halfWidth = spec.width / 2;
  const jambThickness = Math.min(REVEAL_FACE, spec.width / 2);
  const headThickness = Math.min(REVEAL_FACE, height / 2);
  const clearWidth = Math.max(0.01, spec.width - 2 * jambThickness);


  return [
    {
      id: `${spec.id}_REVEAL_LEFT`,
      geometry: new THREE.BoxGeometry(revealDepth, height, jambThickness),
      position: [xMid, yCenter, zCenter - halfWidth + jambThickness / 2],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_RIGHT`,
      geometry: new THREE.BoxGeometry(revealDepth, height, jambThickness),
      position: [xMid, yCenter, zCenter + halfWidth - jambThickness / 2],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_HEAD`,
      geometry: new THREE.BoxGeometry(revealDepth, headThickness, clearWidth),
      position: [xMid, yBottom + height - headThickness / 2, zCenter],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_SILL`,
      geometry: new THREE.BoxGeometry(revealDepth, headThickness, clearWidth),
      position: [xMid, yBottom + headThickness / 2, zCenter],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
  ];
}

function makeSimpleWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = buildFrameGeometry(width, height, { rotateForSide: true });
  const glassGeometry = createGlassGeometry(innerWidth, innerHeight);

  return [
    {
      id: `${id}_FRAME`,
      geometry: frameGeometry,
      position: [frameX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${id}_GLASS`,
      geometry: glassGeometry,
      position: [glassX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
    buildSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }),
  ];
}

function makeSplitTallWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const frameGeometry = buildFrameGeometry(width, height, { rotateForSide: true });
  const yCenter = yBottom + height / 2;
  const windowBottomLocal = -height / 2;

  const lowerGlassHeight = 2.45;
  const bandHeight = 0.45;
  const upperGlassHeight = 2.1;
  const innerWidth = width - 2 * FRAME_BORDER;

  const lowerGlassCenterLocalY = windowBottomLocal + lowerGlassHeight / 2;
  const metalBandCenterLocalY = windowBottomLocal + 2.45 + bandHeight / 2;
  const upperGlassCenterLocalY = windowBottomLocal + 2.9 + upperGlassHeight / 2;

  const meshes: SideWindowMesh[] = [
    {
      id: `${id}_FRAME`,
      geometry: frameGeometry,
      position: [frameX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${id}_GLASS_LOWER`,
      geometry: createGlassGeometry(innerWidth, lowerGlassHeight),
      position: [glassX, yCenter + lowerGlassCenterLocalY, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
  ];

  meshes.push({
    id: `${id}_GLASS_UPPER`,
    geometry: createGlassGeometry(innerWidth, upperGlassHeight),
    position: [glassX, yCenter + upperGlassCenterLocalY, zCenter],
    rotation: [0, 0, 0],
    material: glassMaterial,
  });

  meshes.push({
    id: `${id}_METAL_BAND`,
    geometry: new THREE.BoxGeometry(METAL_BAND_DEPTH, bandHeight, innerWidth),
    position: [glassX, yCenter + metalBandCenterLocalY, zCenter],
    rotation: [0, 0, 0],
    material: metalSlateMaterial,
  });

  meshes.push(buildSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }));

  const slateBandWidth = spec.width + 0.06;
  const slateBandHeight = 0.08;
  const slateBandDepth = 0.02;
  const slateBandY = levelHeights.firstFloor;
  const slateOutward = side === 'left' ? -1 : 1;
  const slateBandX = xFace + slateOutward * (FRAME_DEPTH / 2 + 0.02);
  meshes.push({
    id: `${id}_SLATE_BAND`,
    geometry: new THREE.BoxGeometry(slateBandDepth, slateBandHeight, slateBandWidth),
    position: [slateBandX, slateBandY, zCenter],
    rotation: [0, 0, 0],
    material: metalBandMaterial,
  });

  const bandY = levelHeights.firstFloor;
  const outward = side === 'left' ? -1 : 1;
  const bandX = frameX + outward * (FRAME_DEPTH / 2 - METAL_BAND_DEPTH / 2 + METAL_BAND_OUTSET);
  meshes.push({
    id: `${id}_FLOOR_BAND`,
    geometry: new THREE.BoxGeometry(METAL_BAND_DEPTH, METAL_BAND_HEIGHT, width),
    position: [bandX, bandY, zCenter],
    rotation: [0, 0, 0],
    material: metalBandMaterial,
  });

  return meshes;
}

const pts = getEnvelopeOuterPolygon();
const minX = Math.min(...pts.map((p) => p.x));
export const sideZMin = Math.min(...pts.map((p) => p.z));
export const sideZMax = Math.max(...pts.map((p) => p.z));
export function sideMirrorZ(z: number, zMin: number, zMax: number, mirror: boolean) {
  return mirror ? zMin + zMax - z : z;
}

export function makeMirrorZ(zMin: number, zMax: number) {
  return (z: number) => sideMirrorZ(z, zMin, zMax, MIRROR_Z);
}

export function getSideWindowZCenter(spec: SideWindowSpec, mirrorZ: (z: number) => number) {
  let zCenter = mirrorZ(spec.zCenter);

  const isTall = spec.kind === 'tall' || spec.type === 'tall';
  if (isTall) {
    zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
  }
  return zCenter;
}

export function sideWindowZ(spec: SideWindowSpec, mirrorZ: (z: number) => number) {
  return getSideWindowZCenter(spec, mirrorZ);
}

const mirrorZ = makeMirrorZ(sideZMin, sideZMax);

const meshes: SideWindowMesh[] = sideWindowSpecs.flatMap((spec) => {
  const zCenter = getSideWindowZCenter(spec, mirrorZ);


  const xFaceForWindow = SIDE === 'right' ? xFaceForRightAtZ(zCenter) : minX;
  const outward = SIDE === 'right' ? 1 : -1;
  const interiorDir = -outward;
  const wallDepth = wallThickness.exterior ?? 0.3;

  const xOuterReveal = xFaceForWindow;
  const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
  const xOuterPlane = xOuterReveal + outward * EPS;

  const frameXForWindow = xOuterPlane - outward * (FRAME_DEPTH / 2);
  const glassXForWindow = frameXForWindow + interiorDir * GLASS_INSET;


  const commonProps = {
    spec,
    frameX: frameXForWindow,
    glassX: glassXForWindow,
    xFace: xOuterPlane,
    zCenter,
    side: SIDE,
  };

  const revealMeshes = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  const windowMeshes = spec.kind === 'small' ? makeSimpleWindow(commonProps) : makeSplitTallWindow(commonProps);
  return [...windowMeshes, ...revealMeshes];
});

export const windowsSide = {
  meshes,
  side: SIDE,
  zMin: sideZMin,
  zMax: sideZMax,
  mirrorZ: MIRROR_Z,
  profile: RIGHT_FACADE_SEGMENTS,
};

// ── Architectural RIGHT facade meshes (negative X world space) ──────────────

function xFaceForLeftAtZ(z: number): number {
  if (z <= LEFT_FACADE_SEGMENTS[0].z1) return LEFT_FACADE_SEGMENTS[0].x;
  if (z <= LEFT_FACADE_SEGMENTS[1].z1) return LEFT_FACADE_SEGMENTS[1].x;
  return LEFT_FACADE_SEGMENTS[2].x;
}

const rightSideMeshes: SideWindowMesh[] = rightSideWindowSpecs.flatMap((spec) => {
  const zCenter     = spec.zCenter; // direct world Z, no mirrorZ
  const xFace       = xFaceForLeftAtZ(zCenter);
  const outward     = -1;           // faces outward toward −X
  const interiorDir =  1;
  const wallDepth   = wallThickness.exterior ?? 0.3;

  const xOuterReveal = xFace;
  const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
  const xOuterPlane  = xOuterReveal + outward * EPS;
  const frameX       = xOuterPlane  - outward * (FRAME_DEPTH / 2);
  const glassX       = frameX       + interiorDir * GLASS_INSET;

  const commonProps = {
    spec,
    frameX,
    glassX,
    xFace: xOuterPlane,
    zCenter,
    side: 'left' as const,
  };

  const revealMeshes = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  return [...makeSimpleWindow(commonProps), ...revealMeshes];
});

export const windowsRightSide = {
  meshes: rightSideMeshes,
};
