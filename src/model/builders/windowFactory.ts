import * as THREE from 'three';
import {
  EPS,
  FRAME_BORDER,
  FRAME_DEPTH,
  GLASS_INSET,
  GLASS_THICKNESS,
  METAL_BAND_DEPTH,
  METAL_BAND_HEIGHT,
  METAL_BAND_OUTSET,
} from '../constants/windowConstants';
import { buildFrameGeometry } from './buildFrameGeometry';
import { buildSill } from './buildSill';
import { frameMaterial, glassMaterial, metalBandMaterial, revealMaterial } from '../materials/windowMaterials';
import { type ArchSide } from '../houseSpec';
import { getEnvelopeOuterPolygon } from '../envelope';

const REVEAL_FACE = 0.05;

const metalSlateMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

export type WindowFactorySpec = {
  id: string;
  kind: 'normal' | 'tall';
  width: number;
  groundY0: number;
  groundY1: number;
  firstY0: number;
  firstY1: number;
};

type SideArchSide = Extract<ArchSide, 'LEFT' | 'RIGHT'>;

export type SideWindowSpec = WindowFactorySpec & {
  archSide: SideArchSide;
  zCenter: number;
};

export const TALL_Z_OFFSET_TO_FRONT = 0.70; // meters

function toRenderZ(kind: WindowFactorySpec['kind'], zCenter: number): number {
  return kind === 'tall' ? zCenter - TALL_Z_OFFSET_TO_FRONT : zCenter;
}

export const RIGHT_WORLD_FACADE_SEGMENTS = [
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
  const profile = side === 'LEFT' ? RIGHT_WORLD_FACADE_SEGMENTS : ARCH_RIGHT_FACADE_SEGMENTS;
  const segment = profile.find((candidate) => z >= candidate.z0 && z <= candidate.z1) ?? profile[profile.length - 1];
  return segment.x;
}

const sideWindowSpecsByArchSide: Record<'LEFT' | 'RIGHT', SideWindowSpec[]> = {
  LEFT: [
    // Extension window
    {
      id: 'L_EXT_1',
      kind: 'normal',
      archSide: 'LEFT',
      zCenter: 2.0,
      width: 1.0,
      groundY0: 0.0,
      groundY1: 2.15,
      firstY0: 0,
      firstY1: 0.0,
    },
    // Tall windows
    {
      id: 'L_TALL_1',
      kind: 'tall',
      archSide: 'LEFT',
      zCenter: 5.5,
      width: 1.1,
      groundY0: 0.0,
      groundY1: 2.45,
      firstY0: 2.45,
      firstY1: 5.0,
    },
    {
      id: 'L_TALL_2',
      kind: 'tall',
      archSide: 'LEFT',
      zCenter: 8.5,
      width: 1.1,
      groundY0: 0.0,
      groundY1: 2.45,
      firstY0: 2.45,
      firstY1: 5.0,
    },
    {
      id: 'L_TALL_3',
      kind: 'tall',
      archSide: 'LEFT',
      zCenter: 11.5,
      width: 1.1,
      groundY0: 0.0,
      groundY1: 2.45,
      firstY0: 2.45,
      firstY1: 5.0,
    },
  ],
  RIGHT: [
    {
      id: 'SIDE_R_DOOR',
      kind: 'normal',
      archSide: 'RIGHT',
      zCenter: toRenderZ('normal', 5.5),
      width: 1.0,
      groundY0: 0.0,
      groundY1: 2.15,
      firstY0: 0.0,
      firstY1: 0.0,
    },
    {
      id: 'SIDE_R_WIN',
      kind: 'tall',
      archSide: 'RIGHT',
      zCenter: toRenderZ('tall', 5.5),
      width: 0.9,
      groundY0: 4.1,
      groundY1: 4.1,
      firstY0: 4.1,
      firstY1: 5.0,
    },
  ],
};

export const leftSideWindowSpecs: SideWindowSpec[] = sideWindowSpecsByArchSide.LEFT;
export const rightSideWindowSpecs: SideWindowSpec[] = sideWindowSpecsByArchSide.RIGHT;

const envelope = getEnvelopeOuterPolygon();
export const sideZMin = Math.min(...envelope.map((p) => p.z));
export const sideZMax = Math.max(...envelope.map((p) => p.z));

export function getSideWindowZCenter(spec: SideWindowSpec, mirrorZ: (z: number) => number) {
  return mirrorZ(spec.zCenter);
}

export type WindowFactoryMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

function windowVerticalExtents(spec: WindowFactorySpec) {
  const yBottom = spec.groundY0;
  const yTop = spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) : spec.groundY1;

  return {
    yBottom,
    height: yTop - yBottom,
  };
}

function createGlassGeometry(width: number, height: number): THREE.BoxGeometry {
  const key = `${width}:${height}`;
  const cached = glassGeomCache.get(key);
  if (cached) return cached;

  const geometry = new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
  glassGeomCache.set(key, geometry);
  return geometry;
}

const glassGeomCache = new Map<string, THREE.BoxGeometry>();

export function createRevealMeshes({
  spec,
  zCenter,
  xOuter,
  xInner,
}: {
  spec: WindowFactorySpec;
  zCenter: number;
  xOuter: number;
  xInner: number;
}): WindowFactoryMesh[] {
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

export function makeSimpleWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
}: {
  spec: WindowFactorySpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
}): WindowFactoryMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = buildFrameGeometry(width, height, {
    rotateForSide: true,
    side,
  });
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

export function makeSplitTallWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
  levelHeights,
}: {
  spec: WindowFactorySpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
  levelHeights: { firstFloor: number };
}): WindowFactoryMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const frameGeometry = buildFrameGeometry(width, height, {
    rotateForSide: true,
    side,
  });
  const yCenter = yBottom + height / 2;
  const windowBottomLocal = -height / 2;

  const lowerGlassHeight = 2.45;
  const bandHeight = 0.45;
  const upperGlassHeight = 2.1;
  const innerWidth = width - 2 * FRAME_BORDER;

  const lowerGlassCenterLocalY = windowBottomLocal + lowerGlassHeight / 2;
  const metalBandCenterLocalY = windowBottomLocal + 2.45 + bandHeight / 2;
  const upperGlassCenterLocalY = windowBottomLocal + 2.9 + upperGlassHeight / 2;

  const meshes: WindowFactoryMesh[] = [
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
  const outward = side === 'left' ? -1 : 1;
  const slateBandX = xFace + slateOutward(side) * (FRAME_DEPTH / 2 + 0.02);
  meshes.push({
    id: `${id}_SLATE_BAND`,
    geometry: new THREE.BoxGeometry(slateBandDepth, slateBandHeight, slateBandWidth),
    position: [slateBandX, slateBandY, zCenter],
    rotation: [0, 0, 0],
    material: metalBandMaterial,
  });

  const bandY = levelHeights.firstFloor;
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

function slateOutward(side: 'left' | 'right') {
  return side === 'left' ? -1 : 1;
}
