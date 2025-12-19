import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_TOP_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;
const LOWER_RIDGE_Y = 9.45;
const CHAMFER_Z = 0.4;

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

function createRoofPlaneGeometry(
  eaveX: number,
  ridgeX: number,
  zStart: number,
  zEnd: number,
  ridgeYStart: number,
  ridgeYEnd: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    eaveX,
    EAVES_TOP_Y,
    zStart,
    ridgeX,
    ridgeYStart,
    zStart,
    ridgeX,
    ridgeYEnd,
    zEnd,
    eaveX,
    EAVES_TOP_Y,
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

function getStepStartZ(segments: RoofSegment[], maxX: number): number | null {
  const epsilon = 1e-4;
  const stepSegment = segments.find((segment) => segment.x < maxX - epsilon);
  return stepSegment ? stepSegment.zStart : null;
}

function findRightXAtZ(segments: RoofSegment[], z: number, fallbackX: number): number {
  const epsilon = 1e-4;
  const match = segments.find(
    (segment) => z + epsilon >= segment.zStart && z - epsilon <= segment.zEnd
  );
  return match ? match.x : fallbackX;
}

function createGableEndGeometry(minX: number, ridgeX: number, maxX: number, eavesY: number, ridgeY: number) {
  const shape = new THREE.Shape();
  shape.moveTo(minX, eavesY);
  shape.lineTo(ridgeX, ridgeY);
  shape.lineTo(maxX, eavesY);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.computeVertexNormals();
  return geometry;
}

function chamferFootprint(
  points: FootprintPoint[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  frontRightX: number,
  backRightX: number
): FootprintPoint[] {
  const epsilon = 1e-4;
  const frontZ = bounds.minZ + CHAMFER_Z;
  const backZ = bounds.maxZ - CHAMFER_Z;

  return points.map((point) => {
    if (Math.abs(point.z - bounds.minZ) < epsilon) {
      if (Math.abs(point.x - bounds.minX) < epsilon) {
        return { ...point, z: frontZ };
      }
      if (Math.abs(point.x - frontRightX) < epsilon) {
        return { ...point, z: frontZ };
      }
    }

    if (Math.abs(point.z - bounds.maxZ) < epsilon) {
      if (Math.abs(point.x - bounds.minX) < epsilon) {
        return { ...point, z: backZ };
      }
      if (Math.abs(point.x - backRightX) < epsilon) {
        return { ...point, z: backZ };
      }
    }

    return point;
  });
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);
  const ridgeX = (bounds.minX + bounds.maxX) / 2;
  const initialRightSegments = extractRightRoofSegments(footprint, ridgeX);
  const frontRightX = findRightXAtZ(initialRightSegments, bounds.minZ, bounds.maxX);
  const backRightX = findRightXAtZ(initialRightSegments, bounds.maxZ, bounds.maxX);
  const chamferedFootprint = chamferFootprint(footprint, bounds, frontRightX, backRightX);
  const rightSegments = extractRightRoofSegments(chamferedFootprint, ridgeX);
  const stepStartZ = getStepStartZ(rightSegments, bounds.maxX);
  const interiorZStart = bounds.minZ + CHAMFER_Z;
  const interiorZEnd = bounds.maxZ - CHAMFER_Z;

  console.log('ROOF +X segments', rightSegments);
  console.log('ROOF ridgeX', ridgeX);

  console.log('🏠 Roof anchored to eaves band at Y =', EAVES_TOP_Y);

  console.log('ROOF bounds', {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    depthZ: bounds.maxZ - bounds.minZ,
  });
  console.log('ROOF ridge', { ridgeX, ridgeY: MAIN_RIDGE_Y, minZ: bounds.minZ, maxZ: bounds.maxZ });

  const ridgeYAtZ = (z: number) => {
    if (stepStartZ !== null && z >= stepStartZ) {
      return LOWER_RIDGE_Y;
    }
    return MAIN_RIDGE_Y;
  };

  const frontCapZ = interiorZStart;
  const backCapZ = interiorZEnd;
  const frontCapRightX = findRightXAtZ(rightSegments, frontCapZ, bounds.maxX);
  const backCapRightX = findRightXAtZ(rightSegments, backCapZ, bounds.maxX);
  const frontRidgeY = ridgeYAtZ(frontCapZ);
  const backRidgeY = ridgeYAtZ(backCapZ);
  const epsilon = 1e-4;

  const meshes = [
    {
      geometry: createRoofPlaneGeometry(
        bounds.minX,
        ridgeX,
        interiorZStart,
        interiorZEnd,
        MAIN_RIDGE_Y,
        MAIN_RIDGE_Y
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    ...rightSegments
      .map((segment) => {
        const zStart = Math.max(segment.zStart, interiorZStart);
        const zEnd = Math.min(segment.zEnd, interiorZEnd);
        if (zEnd - zStart <= epsilon) {
          return null;
        }
        return {
          geometry: createRoofPlaneGeometry(
            segment.x,
            ridgeX,
            zStart,
            zEnd,
            ridgeYAtZ(zStart),
            ridgeYAtZ(zEnd)
          ),
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        };
      })
      .filter((mesh): mesh is { geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] } => Boolean(mesh)),
    {
      geometry: createGableEndGeometry(bounds.minX, ridgeX, frontCapRightX, EAVES_TOP_Y, frontRidgeY),
      position: [0, 0, frontCapZ],
      rotation: [0, 0, 0],
    },
    {
      geometry: createGableEndGeometry(bounds.minX, ridgeX, backCapRightX, EAVES_TOP_Y, backRidgeY),
      position: [0, 0, backCapZ],
      rotation: [0, 0, 0],
    },
  ];

  return { meshes };
}
