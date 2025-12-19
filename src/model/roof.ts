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

function createRoofPlaneGeometry(
  eaveX: number,
  ridgeX: number,
  zStart: number,
  zEnd: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    eaveX,
    EAVES_Y,
    zStart,
    ridgeX,
    MAIN_RIDGE_Y,
    zStart,
    ridgeX,
    MAIN_RIDGE_Y,
    zEnd,
    eaveX,
    EAVES_Y,
    zEnd,
  ]);
  const indices = [0, 1, 2, 0, 2, 3];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

type RoofSegment = {
  x: number;
  zStart: number;
  zEnd: number;
};

function extractRightRoofSegments(points: FootprintPoint[], ridgeX: number): RoofSegment[] {
  const epsilon = 1e-4;
  const segments: RoofSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const deltaX = Math.abs(current.x - next.x);

    if (deltaX > epsilon) {
      continue;
    }

    const edgeX = (current.x + next.x) / 2;

    if (edgeX < ridgeX - epsilon) {
      continue;
    }

    const zStart = Math.min(current.z, next.z);
    const zEnd = Math.max(current.z, next.z);

    if (Math.abs(zEnd - zStart) < epsilon) {
      continue;
    }

    segments.push({ x: edgeX, zStart, zEnd });
  }

  return segments.sort((a, b) => a.zStart - b.zStart);
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  ridgeLines: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);
  const ridgeX = (bounds.minX + bounds.maxX) / 2;
  const rightSegments = extractRightRoofSegments(footprint, ridgeX);

  console.log('ROOF bounds', {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    depthZ,
  });
  console.log('ROOF ridge', { ridgeX, ridgeY: MAIN_RIDGE_Y, minZ: bounds.minZ, maxZ: bounds.maxZ });

  const meshes = [
    {
      geometry: createRoofPlaneGeometry(bounds.minX, ridgeX, bounds.minZ, bounds.maxZ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    ...rightSegments.map((segment) => ({
      geometry: createRoofPlaneGeometry(segment.x, ridgeX, segment.zStart, segment.zEnd),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    })),
  ];

  const ridgeLines = [
    {
      geometry: createRidgeLine(ridgeX, MAIN_RIDGE_Y, bounds.minZ, bounds.maxZ),
      position: [0, 0, 0] as [number, number, number],
    },
  ];

  return { meshes, ridgeLines };
}
