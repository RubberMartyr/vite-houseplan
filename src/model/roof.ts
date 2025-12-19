import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;

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

function createRidgeLine(x: number, y: number, minZ: number, maxZ: number): THREE.BufferGeometry {
  const points = [new THREE.Vector3(x, y, minZ), new THREE.Vector3(x, y, maxZ)];
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  ridgeLines: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);
  const depthZ = bounds.maxZ - bounds.minZ;
  const ridgeX = (bounds.minX + bounds.maxX) / 2;

  console.log('ROOF bounds', {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    depthZ,
  });
  console.log('ROOF ridge', { ridgeX, ridgeY: MAIN_RIDGE_Y, minZ: bounds.minZ, maxZ: bounds.maxZ });

  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(bounds.minX, EAVES_Y);
  triangleShape.lineTo(ridgeX, MAIN_RIDGE_Y);
  triangleShape.lineTo(bounds.maxX, EAVES_Y);
  triangleShape.lineTo(bounds.minX, EAVES_Y);

  const roofGeometry = new THREE.ExtrudeGeometry(triangleShape, {
    depth: depthZ,
    bevelEnabled: false,
  });

  const meshes = [
    {
      geometry: roofGeometry,
      position: [0, 0, bounds.minZ],
      rotation: [0, 0, 0],
    },
  ];

  const ridgeLines = [
    {
      geometry: createRidgeLine(ridgeX, MAIN_RIDGE_Y, bounds.minZ, bounds.maxZ),
      position: [0, 0, 0] as [number, number, number],
    },
  ];

  return { meshes, ridgeLines };
}
