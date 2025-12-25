import * as THREE from 'three';
import { getEnvelopeOuterPolygon } from './envelope';

type SideWindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

export type SideWindowSpec = {
  id: string;
  zCenter: number;
  width: number;
  yBottom: number;
  height: number;
  type: 'simple' | 'splitTall';
};

const EPS = 0.01;
const FRAME_DEPTH = 0.08;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;
const GLASS_THICKNESS = 0.01;
const METAL_BAND_DEPTH = 0.02;
const SILL_DEPTH = 0.18;
const SILL_HEIGHT = 0.05;
const SILL_OVERHANG = 0.02;

// Toggle which facade hosts the side windows and whether they should mirror along Z
export const SIDE: 'left' | 'right' = 'right';
export const MIRROR_Z = true;

export const sideWindowSpecs: SideWindowSpec[] = [
  { id: 'SIDE_L_EXT', zCenter: 1.2, width: 1.0, yBottom: 0.0, height: 2.15, type: 'simple' },
  { id: 'SIDE_L_TALL_1', zCenter: 4.5, width: 1.0, yBottom: 0.0, height: 5.0, type: 'splitTall' },
  { id: 'SIDE_L_TALL_2', zCenter: 6.8, width: 1.0, yBottom: 0.0, height: 5.0, type: 'splitTall' },
  { id: 'SIDE_L_TALL_3', zCenter: 9.1, width: 1.0, yBottom: 0.0, height: 5.0, type: 'splitTall' },
];

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#e6e8ea',
  transmission: 0.85,
  roughness: 0.05,
  ior: 1.5,
  metalness: 0,
  clearcoat: 0,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

const metalSlateMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

function createFrameGeometry(width: number, height: number): THREE.ExtrudeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, -halfHeight);

  const innerPath = new THREE.Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const geometry = new THREE.ExtrudeGeometry(outerShape, { depth: FRAME_DEPTH, bevelEnabled: false });
  geometry.translate(0, 0, -FRAME_DEPTH / 2);
  geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createGlassGeometry(width: number, height: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
}

function createSill({
  id,
  width,
  zCenter,
  yBottom,
  side,
  xFace,
}: {
  id: string;
  width: number;
  zCenter: number;
  yBottom: number;
  side: 'left' | 'right';
  xFace: number;
}): SideWindowMesh {
  const sillX =
    side === 'left'
      ? xFace - EPS - SILL_DEPTH / 2 - SILL_OVERHANG
      : xFace + EPS + SILL_DEPTH / 2 + SILL_OVERHANG;

  const geometry = new THREE.BoxGeometry(SILL_DEPTH, SILL_HEIGHT, width + 0.04);
  const position: [number, number, number] = [sillX, yBottom - SILL_HEIGHT / 2, zCenter];

  return {
    id,
    geometry,
    position,
    rotation: [0, 0, 0],
    material: blueStoneMaterial,
  };
}

function makeSimpleWindow({
  spec,
  frameX,
  glassX,
  zCenter,
  xFace,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  zCenter: number;
  xFace: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width, height, yBottom } = spec;
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = createFrameGeometry(width, height);
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
    createSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }),
  ];
}

function makeSplitTallWindow({
  spec,
  frameX,
  glassX,
  zCenter,
  xFace,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  zCenter: number;
  xFace: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width, height, yBottom } = spec;
  const frameGeometry = createFrameGeometry(width, height);

  const lowerGlassHeight = Math.min(2.45, height - FRAME_BORDER * 2);
  const bandHeight = 0.45;
  const upperStart = 2.9;
  const upperGlassHeight = Math.max(height - upperStart, 0);
  const innerWidth = width - 2 * FRAME_BORDER;

  const meshes: SideWindowMesh[] = [
    {
      id: `${id}_FRAME`,
      geometry: frameGeometry,
      position: [frameX, yBottom + height / 2, zCenter],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${id}_GLASS_LOWER`,
      geometry: createGlassGeometry(innerWidth, lowerGlassHeight),
      position: [glassX, yBottom + lowerGlassHeight / 2, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
  ];

  if (upperGlassHeight > 0) {
    meshes.push({
      id: `${id}_GLASS_UPPER`,
      geometry: createGlassGeometry(innerWidth, upperGlassHeight),
      position: [glassX, yBottom + upperStart + upperGlassHeight / 2, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    });
  }

  meshes.push({
    id: `${id}_METAL_BAND`,
    geometry: new THREE.BoxGeometry(METAL_BAND_DEPTH, bandHeight, innerWidth),
    position: [glassX, yBottom + lowerGlassHeight + bandHeight / 2, zCenter],
    rotation: [0, 0, 0],
    material: metalSlateMaterial,
  });

  meshes.push(createSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }));

  return meshes;
}

const pts = getEnvelopeOuterPolygon();
const minX = Math.min(...pts.map((p) => p.x));
const maxX = Math.max(...pts.map((p) => p.x));
const xFace = SIDE === 'left' ? minX : maxX;
const edgePts = pts.filter((p) => Math.abs(p.x - xFace) < EPS);
const zMin = Math.min(...edgePts.map((p) => p.z));
const zMax = Math.max(...edgePts.map((p) => p.z));
const mirrorZ = (z: number) => (MIRROR_Z ? zMin + zMax - z : z);
const frameX = SIDE === 'left' ? xFace - EPS + FRAME_DEPTH / 2 : xFace + EPS - FRAME_DEPTH / 2;
const glassX = SIDE === 'left' ? frameX + GLASS_INSET : frameX - GLASS_INSET;

console.log('✅ SIDE WINDOWS MODEL COORDS', { side: SIDE, xFace, zMin, zMax });

const meshes: SideWindowMesh[] = sideWindowSpecs.flatMap((spec) => {
  const zCenter = mirrorZ(spec.zCenter);
  const commonProps = { spec, frameX, glassX, zCenter, xFace, side: SIDE };

  if (spec.type === 'simple') return makeSimpleWindow(commonProps);
  return makeSplitTallWindow(commonProps);
});

export const windowsSide = {
  meshes,
  side: SIDE,
  xFace,
  zMin,
  zMax,
  mirrorZ: MIRROR_Z,
};
