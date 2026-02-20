import * as THREE from 'three';
import { EPS, FRAME_BORDER, FRAME_DEPTH, GLASS_INSET, GLASS_THICKNESS } from '../constants/windowConstants';
import { buildFrameGeometry } from './buildFrameGeometry';
import { buildSill } from './buildSill';
import { frameMaterial, glassMaterial, metalBandMaterial, revealMaterial } from '../materials/windowMaterials';

const METAL_BAND_DEPTH = 0.02;
const METAL_BAND_HEIGHT = 0.12;
const METAL_BAND_OUTSET = 0.015;
const REVEAL_FACE = 0.05;

const metalSlateMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

export type WindowFactorySpec = {
  id: string;
  kind: 'small' | 'tall';
  type?: 'small' | 'tall';
  width: number;
  groundY0: number;
  groundY1: number;
  firstY0: number;
  firstY1: number;
};

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
  return new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
}

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
