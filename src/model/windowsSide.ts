import * as THREE from 'three';
import { ARCH_SIDE_TO_WORLD_X, ceilingHeights, levelHeights, type ArchSide, wallThickness } from './houseSpec';
import { getEnvelopeOuterPolygon } from './envelope';
import { EPS, FRAME_DEPTH, GLASS_INSET } from './constants/windowConstants';
import { createRevealMeshes, makeSimpleWindow, makeSplitTallWindow } from './builders/windowFactory';

type SideWindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

type SideArchSide = Extract<ArchSide, 'LEFT' | 'RIGHT'>;

export type SideWindowSpec = {
  id: string;
  kind: 'small' | 'tall';
  type?: 'small' | 'tall';
  archSide: SideArchSide;
  zCenter: number;
  width: number;
  groundY0: number;
  groundY1: number;
  firstY0: number;
  firstY1: number;
};

export const TALL_Z_OFFSET_TO_FRONT = 0.70; // meters

// NOTE: Positive X = architectural LEFT facade (mirrored from source).
//       Negative X = architectural RIGHT facade.
export const ARCH_LEFT_FACADE_SEGMENTS = [
  { id: 'L_A', z0: 0.0, z1: 4.0, x: +4.8 },
  { id: 'L_B', z0: 4.0, z1: 8.45, x: +4.1 },
  { id: 'L_C', z0: 8.45, z1: 12.0, x: +3.5 },
] as const;

export const ARCH_RIGHT_FACADE_SEGMENTS = [
  { id: 'R_A', z0: 0.0, z1: 4.0, x: -4.8 },
  { id: 'R_B', z0: 4.0, z1: 8.45, x: -4.1 },
  { id: 'R_C', z0: 8.45, z1: 12.0, x: -3.5 },
] as const;

export function xFaceForArchSideAtZ(side: SideArchSide, z: number) {
  const profile = side === 'LEFT' ? ARCH_LEFT_FACADE_SEGMENTS : ARCH_RIGHT_FACADE_SEGMENTS;

  const segment = profile.find((candidate) => z >= candidate.z0 && z <= candidate.z1) ?? profile[profile.length - 1];

  return segment.x;
}

// Toggle whether side windows should mirror along Z
const PRIMARY_ARCH_SIDE: SideArchSide = 'LEFT';
export const MIRROR_Z = true;

const sideWindowSpecsByArchSide: Record<'LEFT' | 'RIGHT', SideWindowSpec[]> = {
  LEFT: [
  {
    id: 'SIDE_L_EXT',
    kind: 'small',
    archSide: 'LEFT',
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
    archSide: 'LEFT',
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
    archSide: 'LEFT',
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
    archSide: 'LEFT',
    zCenter: 9.35,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
],
  RIGHT: [
  {
    // Ground-floor door (rendered as full-glass window)
    id: 'SIDE_R_DOOR',
    kind: 'small',
    archSide: 'RIGHT',
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
    archSide: 'RIGHT',
    zCenter: 5.5,
    width: 0.9,
    groundY0: 4.1,  // yBottom = groundY0 (bottom of window in world Y)
    groundY1: 4.1,  // equal to groundY0 so no ground-floor glass renders
    firstY0: 4.1,
    firstY1: 5.0,
  },
],
};

export const sideWindowSpecs = sideWindowSpecsByArchSide.LEFT;
export const rightSideWindowSpecs = sideWindowSpecsByArchSide.RIGHT;


const pts = getEnvelopeOuterPolygon();
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

function sideToSillSide(archSide: SideArchSide): 'left' | 'right' {
  return archSide === 'LEFT' ? 'right' : 'left';
}

const mirrorZ = makeMirrorZ(sideZMin, sideZMax);

const meshes: SideWindowMesh[] = sideWindowSpecs.flatMap((spec) => {
  const zCenter = getSideWindowZCenter(spec, mirrorZ);


  const xFaceForWindow = xFaceForArchSideAtZ(spec.archSide, zCenter);
  const outward = ARCH_SIDE_TO_WORLD_X[spec.archSide];
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
    side: sideToSillSide(spec.archSide),
  };

  const revealMeshes = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  const windowMeshes = spec.kind === 'small' ? makeSimpleWindow(commonProps) : makeSplitTallWindow({ ...commonProps, levelHeights });
  return [...windowMeshes, ...revealMeshes];
});

export const windowsSide = {
  meshes,
  side: PRIMARY_ARCH_SIDE,
  zMin: sideZMin,
  zMax: sideZMax,
  mirrorZ: MIRROR_Z,
  profile: ARCH_LEFT_FACADE_SEGMENTS,
};

// ── Architectural RIGHT facade meshes (negative X world space) ──────────────

const rightSideMeshes: SideWindowMesh[] = rightSideWindowSpecs.flatMap((spec) => {
  const zCenter     = spec.zCenter; // direct world Z, no mirrorZ
  const xFace = xFaceForArchSideAtZ(spec.archSide, zCenter);
  const outward = ARCH_SIDE_TO_WORLD_X[spec.archSide];
  const interiorDir = -outward;
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
    side: sideToSillSide(spec.archSide),
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
