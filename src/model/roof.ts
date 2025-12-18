import * as THREE from 'three';
import { getEnvelopeFirstOuterPolygon } from './envelope';
import { FootprintPoint } from './envelope';

const EAVES_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;
const SECONDARY_RIDGE_Y = 9.45;
const STEP_Y = 7.65;

function computeBounds(points: FootprintPoint[]) {
  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minZ: Math.min(acc.minZ, point.z),
      maxZ: Math.max(acc.maxZ, point.z),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );
}

function createRoofPlane(
  xMin: number,
  xMax: number,
  zStart: number,
  yStart: number,
  zEnd: number,
  yEnd: number
): THREE.BufferGeometry {
  const vertices = new Float32Array([
    xMin,
    yStart,
    zStart,
    xMax,
    yStart,
    zStart,
    xMin,
    yEnd,
    zEnd,
    xMax,
    yEnd,
    zEnd,
  ]);

  const indices = [0, 2, 1, 1, 2, 3];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createRidgeLine(xMin: number, xMax: number, y: number, z: number): THREE.BufferGeometry {
  const points = [
    new THREE.Vector3(xMin, y, z),
    new THREE.Vector3(xMax, y, z),
  ];
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  ridgeLines: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);
  const depth = bounds.maxZ - bounds.minZ;

  const frontZ = bounds.minZ;
  const backZ = bounds.maxZ;

  const mainRidgeZ = frontZ + depth * 0.42;
  const secondaryRidgeZ = frontZ + depth * 0.72;
  const backEaveZ = frontZ + depth * 0.92;

  console.log('Roof ridges', {
    main: { z: mainRidgeZ, y: MAIN_RIDGE_Y },
    secondary: { z: secondaryRidgeZ, y: SECONDARY_RIDGE_Y },
    step: { z: backZ, y: STEP_Y },
  });

  const meshes = [
    {
      // Front eaves to main ridge
      geometry: createRoofPlane(bounds.minX, bounds.maxX, frontZ, EAVES_Y, mainRidgeZ, MAIN_RIDGE_Y),
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    {
      // Main ridge down to secondary ridge
      geometry: createRoofPlane(bounds.minX, bounds.maxX, mainRidgeZ, MAIN_RIDGE_Y, secondaryRidgeZ, SECONDARY_RIDGE_Y),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      // Secondary ridge down to back eaves
      geometry: createRoofPlane(bounds.minX, bounds.maxX, secondaryRidgeZ, SECONDARY_RIDGE_Y, backEaveZ, EAVES_Y),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      // Back eaves up to step/break line
      geometry: createRoofPlane(bounds.minX, bounds.maxX, backEaveZ, EAVES_Y, backZ, STEP_Y),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  const ridgeLines = [
    {
      geometry: createRidgeLine(bounds.minX, bounds.maxX, MAIN_RIDGE_Y, mainRidgeZ),
      position: [0, 0, 0] as [number, number, number],
    },
    {
      geometry: createRidgeLine(bounds.minX, bounds.maxX, SECONDARY_RIDGE_Y, secondaryRidgeZ),
      position: [0, 0, 0] as [number, number, number],
    },
    {
      geometry: createRidgeLine(bounds.minX, bounds.maxX, STEP_Y, backZ),
      position: [0, 0, 0] as [number, number, number],
    },
  ];

  return { meshes, ridgeLines };
}
