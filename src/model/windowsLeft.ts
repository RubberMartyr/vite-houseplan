import * as THREE from 'three';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import { getEnvelopeOuterPolygon } from './envelope';
import { EPS, FRAME_BORDER, FRAME_DEPTH, GLASS_INSET, GLASS_THICKNESS } from './constants/windowConstants';
import { buildFrameGeometry } from './builders/buildFrameGeometry';
import { buildSill } from './builders/buildSill';
import { frameMaterial, glassMaterial, metalBandMaterial, revealMaterial } from './materials/windowMaterials';

export type SideWindowMesh = {
  id: string;
  meshes: THREE.Object3D[];
};

type SideWindowSpec = {
  id: string;
  kind: 'small' | 'tall';
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
const TALL_Z_OFFSET_TO_FRONT = 0.70;

function windowVerticalExtents(spec: SideWindowSpec) {
  const yBottom = spec.groundY0;
  const yTop = spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) : spec.groundY1;

  return {
    yBottom,
    height: yTop - yBottom,
  };
}

export const ARCH_LEFT_FACADE_SEGMENTS = [
  { id:'L_A', z0:0.0, z1:4.0,  x:4.8 },
  { id:'L_B', z0:4.0, z1:8.45, x:4.1 },
  { id:'L_C', z0:8.45,z1:12.0, x:3.5 },
] as const;

function xFaceAtZ(z: number) {
  const segment = ARCH_LEFT_FACADE_SEGMENTS.find((candidate) => z >= candidate.z0 && z <= candidate.z1)
    ?? ARCH_LEFT_FACADE_SEGMENTS[ARCH_LEFT_FACADE_SEGMENTS.length - 1];
  return segment.x;
}

const sideWindowSpecs: SideWindowSpec[] = [
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

function createGlassGeometry(width: number, height: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
}

function asMesh(id: string, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = id;
  mesh.position.set(...position);
  return mesh;
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
}): THREE.Object3D[] {
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const revealDepth = Math.abs(xOuter - xInner);
  const xMid = (xOuter + xInner) / 2;
  const halfWidth = spec.width / 2;
  const jambThickness = Math.min(REVEAL_FACE, spec.width / 2);
  const headThickness = Math.min(REVEAL_FACE, height / 2);
  const clearWidth = Math.max(0.01, spec.width - 2 * jambThickness);

  return [
    asMesh(`${spec.id}_REVEAL_LEFT`, new THREE.BoxGeometry(revealDepth, height, jambThickness), revealMaterial, [xMid, yCenter, zCenter - halfWidth + jambThickness / 2]),
    asMesh(`${spec.id}_REVEAL_RIGHT`, new THREE.BoxGeometry(revealDepth, height, jambThickness), revealMaterial, [xMid, yCenter, zCenter + halfWidth - jambThickness / 2]),
    asMesh(`${spec.id}_REVEAL_HEAD`, new THREE.BoxGeometry(revealDepth, headThickness, clearWidth), revealMaterial, [xMid, yBottom + height - headThickness / 2, zCenter]),
    asMesh(`${spec.id}_REVEAL_SILL`, new THREE.BoxGeometry(revealDepth, headThickness, clearWidth), revealMaterial, [xMid, yBottom + headThickness / 2, zCenter]),
  ];
}

function makeSimpleWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
}): THREE.Object3D[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = buildFrameGeometry(width, height, { rotateForSide: true });
  const glassGeometry = createGlassGeometry(innerWidth, innerHeight);

  const sill = buildSill({ id: `${id}_SILL`, width, zCenter, yBottom, side: 'right', xFace });
  return [
    asMesh(`${id}_FRAME`, frameGeometry, frameMaterial, [frameX, yCenter, zCenter]),
    asMesh(`${id}_GLASS`, glassGeometry, glassMaterial, [glassX, yCenter, zCenter]),
    asMesh(sill.id, sill.geometry, sill.material ?? metalBandMaterial, sill.position),
  ];
}

function makeSplitTallWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
}): THREE.Object3D[] {
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

  const outward = 1;
  const slateBandWidth = spec.width + 0.06;
  const slateBandHeight = 0.08;
  const slateBandDepth = 0.02;
  const slateBandY = levelHeights.firstFloor;
  const slateBandX = xFace + outward * (FRAME_DEPTH / 2 + 0.02);

  const bandY = levelHeights.firstFloor;
  const bandX = frameX + outward * (FRAME_DEPTH / 2 - METAL_BAND_DEPTH / 2 + METAL_BAND_OUTSET);

  const sill = buildSill({ id: `${id}_SILL`, width, zCenter, yBottom, side: 'right', xFace });

  return [
    asMesh(`${id}_FRAME`, frameGeometry, frameMaterial, [frameX, yCenter, zCenter]),
    asMesh(`${id}_GLASS_LOWER`, createGlassGeometry(innerWidth, lowerGlassHeight), glassMaterial, [glassX, yCenter + lowerGlassCenterLocalY, zCenter]),
    asMesh(`${id}_GLASS_UPPER`, createGlassGeometry(innerWidth, upperGlassHeight), glassMaterial, [glassX, yCenter + upperGlassCenterLocalY, zCenter]),
    asMesh(`${id}_METAL_BAND`, new THREE.BoxGeometry(METAL_BAND_DEPTH, bandHeight, innerWidth), metalBandMaterial, [glassX, yCenter + metalBandCenterLocalY, zCenter]),
    asMesh(sill.id, sill.geometry, sill.material ?? metalBandMaterial, sill.position),
    asMesh(`${id}_SLATE_BAND`, new THREE.BoxGeometry(slateBandDepth, slateBandHeight, slateBandWidth), metalBandMaterial, [slateBandX, slateBandY, zCenter]),
    asMesh(`${id}_FLOOR_BAND`, new THREE.BoxGeometry(METAL_BAND_DEPTH, METAL_BAND_HEIGHT, width), metalBandMaterial, [bandX, bandY, zCenter]),
  ];
}

const pts = getEnvelopeOuterPolygon();
const sideZMin = Math.min(...pts.map((p) => p.z));
const sideZMax = Math.max(...pts.map((p) => p.z));
const mirrorZ = (z: number) => sideZMin + sideZMax - z;

function getSideWindowZCenter(spec: SideWindowSpec) {
  let zCenter = mirrorZ(spec.zCenter);
  if (spec.kind === 'tall') {
    zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
  }
  return zCenter;
}

const meshes: SideWindowMesh[] = sideWindowSpecs.map((spec) => {
  const zCenter = getSideWindowZCenter(spec);

  const xFaceForWindow = xFaceAtZ(zCenter);
  const outwardNormal = new THREE.Vector3(1,0,0);
  const interiorDir = -outwardNormal.x;
  const wallDepth = wallThickness.exterior ?? 0.3;

  const xOuterReveal = xFaceForWindow;
  const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
  const xOuterPlane = xOuterReveal + outwardNormal.x * EPS;

  const frameXForWindow = xOuterPlane - outwardNormal.x * (FRAME_DEPTH / 2);
  const glassXForWindow = frameXForWindow + interiorDir * GLASS_INSET;

  const windowMeshes = spec.kind === 'small'
    ? makeSimpleWindow({ spec, frameX: frameXForWindow, glassX: glassXForWindow, xFace: xOuterPlane, zCenter })
    : makeSplitTallWindow({ spec, frameX: frameXForWindow, glassX: glassXForWindow, xFace: xOuterPlane, zCenter });

  const revealMeshes = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  return { id: spec.id, meshes: [...windowMeshes, ...revealMeshes] };
});

export const windowsLeft = {
  meshes,
  profile: ARCH_LEFT_FACADE_SEGMENTS,
};
