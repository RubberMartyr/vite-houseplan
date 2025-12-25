import * as THREE from 'three';
import { getEnvelopeOuterPolygon } from './envelope';

type WindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

const FRAME_DEPTH = 0.08;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;
const GLASS_THICKNESS = 0.01;
const EPS = 0.005;
const SILL_DEPTH = 0.18;
const SILL_HEIGHT = 0.05;
const SILL_OVERHANG = 0.02;

export const sideLeftWindowCenters = {
  ext: 1.2,
  tall1: 4.5,
  tall2: 6.8,
  tall3: 9.1,
};

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#e6e8ea',
  transmission: 0.85,
  thickness: 0.01,
  roughness: 0.05,
  metalness: 0.0,
  ior: 1.5,
  reflectivity: 0.25,
  transparent: true,
  opacity: 1.0,
  clearcoat: 0.1,
  clearcoatRoughness: 0.1,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

const metalBandMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

function getLeftX(): number {
  const outer = getEnvelopeOuterPolygon();
  return outer.reduce((min, point) => Math.min(min, point.x), Infinity);
}

function makeFrameGeometry(width: number, height: number): THREE.BufferGeometry {
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-width / 2, -height / 2);
  outerShape.lineTo(width / 2, -height / 2);
  outerShape.lineTo(width / 2, height / 2);
  outerShape.lineTo(-width / 2, height / 2);
  outerShape.lineTo(-width / 2, -height / 2);

  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const innerPath = new THREE.Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const geometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: false,
  });

  geometry.translate(0, 0, -FRAME_DEPTH / 2);
  geometry.rotateY(Math.PI / 2);

  return geometry;
}

function makeGlassGeometry(width: number, height: number): THREE.BufferGeometry {
  const innerWidth = width - 2 * FRAME_BORDER;
  const geometry = new THREE.BoxGeometry(GLASS_THICKNESS, height, innerWidth);
  return geometry;
}

function makeSill({
  id,
  width,
  xFace,
  zCenter,
}: {
  id: string;
  width: number;
  xFace: number;
  zCenter: number;
}): WindowMesh {
  const geometry = new THREE.BoxGeometry(SILL_DEPTH, SILL_HEIGHT, width + 0.04);
  const position: [number, number, number] = [
    xFace - SILL_DEPTH / 2 - SILL_OVERHANG,
    SILL_HEIGHT / 2,
    zCenter,
  ];

  return {
    id,
    geometry,
    position,
    rotation: [0, 0, 0],
    material: blueStoneMaterial,
  };
}

function makeTallWindow(idBase: string, zCenter: number, xFace: number): WindowMesh[] {
  const width = 1.0;
  const height = 5.0;
  const frameX = xFace - EPS + FRAME_DEPTH / 2;
  const glassX = frameX + GLASS_INSET;

  const frameGeometry = makeFrameGeometry(width, height);
  const framePosition: [number, number, number] = [frameX, height / 2, zCenter];

  const lowerGlassHeight = 2.45 - FRAME_BORDER;
  const upperGlassHeight = 2.1 - FRAME_BORDER;
  const bandHeight = 0.45;

  const lowerGlassPosition: [number, number, number] = [
    glassX,
    FRAME_BORDER + lowerGlassHeight / 2,
    zCenter,
  ];

  const bandPosition: [number, number, number] = [glassX, 2.45 + bandHeight / 2, zCenter];

  const upperGlassPosition: [number, number, number] = [glassX, 2.9 + upperGlassHeight / 2, zCenter];

  const sill = makeSill({
    id: `${idBase}_SILL`,
    width,
    xFace,
    zCenter,
  });

  return [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: framePosition,
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${idBase}_GLASS_LOWER`,
      geometry: makeGlassGeometry(width, lowerGlassHeight),
      position: lowerGlassPosition,
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
    {
      id: `${idBase}_BAND`,
      geometry: new THREE.BoxGeometry(GLASS_THICKNESS * 2, bandHeight, width - 2 * FRAME_BORDER),
      position: bandPosition,
      rotation: [0, 0, 0],
      material: metalBandMaterial,
    },
    {
      id: `${idBase}_GLASS_UPPER`,
      geometry: makeGlassGeometry(width, upperGlassHeight),
      position: upperGlassPosition,
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
    sill,
  ];
}

function makeExtensionWindow(idBase: string, zCenter: number, xFace: number): WindowMesh[] {
  const width = 1.0;
  const height = 2.15;
  const frameX = xFace - EPS + FRAME_DEPTH / 2;
  const glassX = frameX + GLASS_INSET;

  const frameGeometry = makeFrameGeometry(width, height);
  const glassGeometry = makeGlassGeometry(width, height - FRAME_BORDER);

  const framePosition: [number, number, number] = [frameX, height / 2, zCenter];
  const glassPosition: [number, number, number] = [glassX, FRAME_BORDER + (height - FRAME_BORDER) / 2, zCenter];

  const sill = makeSill({
    id: `${idBase}_SILL`,
    width,
    xFace,
    zCenter,
  });

  return [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: framePosition,
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${idBase}_GLASS`,
      geometry: glassGeometry,
      position: glassPosition,
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
    sill,
  ];
}

const xFace = getLeftX();

export const windowsSideLeft: { meshes: WindowMesh[] } = {
  meshes: [
    ...makeExtensionWindow('LEFT_EXT', sideLeftWindowCenters.ext, xFace),
    ...makeTallWindow('LEFT_TALL_1', sideLeftWindowCenters.tall1, xFace),
    ...makeTallWindow('LEFT_TALL_2', sideLeftWindowCenters.tall2, xFace),
    ...makeTallWindow('LEFT_TALL_3', sideLeftWindowCenters.tall3, xFace),
  ],
};

