import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const RIDGE_Y = 9.85;
const THICKNESS = 0.08;

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

function createRoofSolid(
  xMin: number,
  xMax: number,
  zStart: number,
  yStart: number,
  zEnd: number,
  yEnd: number
): THREE.BufferGeometry {
  const p0 = new THREE.Vector3(xMin, yStart, zStart);
  const p1 = new THREE.Vector3(xMax, yStart, zStart);
  const p2 = new THREE.Vector3(xMin, yEnd, zEnd);
  const p3 = new THREE.Vector3(xMax, yEnd, zEnd);

  const normal = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0)).normalize();
  const offset = normal.clone().multiplyScalar(THICKNESS);

  const vertices = new Float32Array([
    p0.x,
    p0.y,
    p0.z,
    p1.x,
    p1.y,
    p1.z,
    p2.x,
    p2.y,
    p2.z,
    p3.x,
    p3.y,
    p3.z,
    p0.x + offset.x,
    p0.y + offset.y,
    p0.z + offset.z,
    p1.x + offset.x,
    p1.y + offset.y,
    p1.z + offset.z,
    p2.x + offset.x,
    p2.y + offset.y,
    p2.z + offset.z,
    p3.x + offset.x,
    p3.y + offset.y,
    p3.z + offset.z,
  ]);

  const indices = [
    // Front face
    0,
    2,
    1,
    1,
    2,
    3,
    // Back face
    5,
    6,
    4,
    5,
    7,
    6,
    // Sides
    0,
    1,
    5,
    0,
    5,
    4,
    1,
    3,
    7,
    1,
    7,
    5,
    3,
    2,
    6,
    3,
    6,
    7,
    2,
    0,
    4,
    2,
    4,
    6,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createRidgeLine(xMin: number, xMax: number, y: number, z: number): THREE.BufferGeometry {
  const points = [new THREE.Vector3(xMin, y, z), new THREE.Vector3(xMax, y, z)];
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  ridgeLines: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);

  const frontZ = bounds.minZ;
  const backZ = bounds.maxZ;
  const ridgeZ = (frontZ + backZ) / 2;

  const meshes = [
    {
      geometry: createRoofSolid(bounds.minX, bounds.maxX, frontZ, EAVES_Y, ridgeZ, RIDGE_Y),
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    {
      geometry: createRoofSolid(bounds.minX, bounds.maxX, backZ, EAVES_Y, ridgeZ, RIDGE_Y),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  const ridgeLines = [
    {
      geometry: createRidgeLine(bounds.minX, bounds.maxX, RIDGE_Y, ridgeZ),
      position: [0, 0, 0] as [number, number, number],
    },
  ];

  return { meshes, ridgeLines };
}
