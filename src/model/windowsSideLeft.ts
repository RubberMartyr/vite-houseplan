import * as THREE from 'three';
import { getEnvelopeOuterPolygon } from './envelope';
import { levelHeights } from './houseSpec';
import { LEFT_FACADE_EPS, LeftFacadeMetrics, getLeftFacadeMetrics } from './leftFacade';

type WindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

export type SideWindowOpening = {
  level: 'ground' | 'first';
  zCenter: number;
  width: number;
  height: number;
  yBottom: number;
};

type SideWindowSpec = {
  idBase: string;
  zCenter: number;
  yBottom: number;
  width: number;
  height: number;
  level: 'ground' | 'first';
};

const FRAME_DEPTH = 0.08;
const EPS = LEFT_FACADE_EPS;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;
const CUTOUT_MARGIN = 0.01;
const SILL_DEPTH = 0.18;
const SILL_HEIGHT = 0.05;
const SILL_OVERHANG = 0.02;

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

const leftMetrics: LeftFacadeMetrics = getLeftFacadeMetrics(getEnvelopeOuterPolygon());
const { leftX, zMin, zMax, widthZ, centerZ } = leftMetrics;

const zCenters: number[] = (() => {
  const span = Math.max(widthZ, 0);
  if (span < 0.5) {
    return [centerZ];
  }
  const margin = Math.min(1.5, span / 4);
  if (zMax - zMin <= margin * 2 + 0.5) {
    return [centerZ];
  }
  return [zMin + margin, zMax - margin];
})();

const buildWindowMeshes = (spec: SideWindowSpec): WindowMesh[] => {
  const { idBase, zCenter, yBottom, width, height } = spec;
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-width / 2, -height / 2);
  outerShape.lineTo(width / 2, -height / 2);
  outerShape.lineTo(width / 2, height / 2);
  outerShape.lineTo(-width / 2, height / 2);
  outerShape.lineTo(-width / 2, -height / 2);

  const innerPath = new THREE.Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const frameGeometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: false,
  });
  frameGeometry.translate(0, 0, -FRAME_DEPTH / 2);
  frameGeometry.rotateY(Math.PI / 2);

  const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.01);
  glassGeometry.rotateY(Math.PI / 2);

  const frameX = leftX - EPS + FRAME_DEPTH / 2;
  const glassX = frameX + GLASS_INSET;

  const framePosition: [number, number, number] = [frameX, yCenter, zCenter];
  const glassPosition: [number, number, number] = [glassX, yCenter, zCenter];

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
    },
  ];
};

const makeSill = ({
  id,
  width,
  zCenter,
  yCenter,
}: {
  id: string;
  width: number;
  zCenter: number;
  yCenter: number;
}): WindowMesh => {
  const geometry = new THREE.BoxGeometry(width, SILL_HEIGHT, SILL_DEPTH);
  geometry.rotateY(Math.PI / 2);
  const xCenter = leftX - SILL_OVERHANG - SILL_DEPTH / 2;

  return {
    id,
    geometry,
    position: [xCenter, yCenter, zCenter],
    rotation: [0, 0, 0],
    material: blueStoneMaterial,
  };
};

const windowSpecs: SideWindowSpec[] = [
  ...zCenters.map((zCenter, index) => ({
    idBase: `SIDE_LEFT_GROUND_${index}`,
    zCenter,
    yBottom: 0.9,
    width: 1.2,
    height: 1.2,
    level: 'ground' as const,
  })),
  ...zCenters.map((zCenter, index) => ({
    idBase: `SIDE_LEFT_FIRST_${index}`,
    zCenter,
    yBottom: levelHeights.firstFloor + 0.8,
    width: 1.0,
    height: 1.1,
    level: 'first' as const,
  })),
];

export const sideWindowOpenings: SideWindowOpening[] = windowSpecs.map((spec) => ({
  level: spec.level,
  zCenter: spec.zCenter,
  width: spec.width + CUTOUT_MARGIN * 2,
  height: spec.height + CUTOUT_MARGIN * 2,
  yBottom: spec.yBottom - CUTOUT_MARGIN,
}));

const windows: WindowMesh[] = windowSpecs.flatMap((spec) => {
  const meshes = buildWindowMeshes(spec);

  const sill = makeSill({
    id: `${spec.idBase}_SILL`,
    width: spec.width + 0.04,
    zCenter: spec.zCenter,
    yCenter: spec.yBottom - SILL_HEIGHT / 2,
  });

  return [...meshes, sill];
});

export const windowsSideLeft: { meshes: WindowMesh[] } = {
  meshes: windows,
};
