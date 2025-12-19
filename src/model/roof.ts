import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const MINI_RIDGE_Y = 7.65;
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
    EAVES_Y,
    zStart,
    ridgeX,
    ridgeYStart,
    zStart,
    ridgeX,
    ridgeYEnd,
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

function deriveIndentationSteps(points: FootprintPoint[]): number[] {
  const epsilon = 1e-4;
  const closedPoints = [...points, points[0]];
  const zSteps = new Set<number>();

  for (let i = 0; i < closedPoints.length - 1; i++) {
    const current = closedPoints[i];
    const next = closedPoints[i + 1];
    const isHorizontal = Math.abs(current.z - next.z) < epsilon;

    if (isHorizontal && next.x < current.x - epsilon) {
      zSteps.add(current.z);
    }
  }

  return Array.from(zSteps).sort((a, b) => a - b);
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

function createTriangleGeometry(
  pointA: THREE.Vector3,
  pointB: THREE.Vector3,
  pointC: THREE.Vector3
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    pointA.x,
    pointA.y,
    pointA.z,
    pointB.x,
    pointB.y,
    pointB.z,
    pointC.x,
    pointC.y,
    pointC.z,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2]);
  geometry.computeVertexNormals();
  return geometry;
}

function createQuadGeometry(
  pointA: THREE.Vector3,
  pointB: THREE.Vector3,
  pointC: THREE.Vector3,
  pointD: THREE.Vector3
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    pointA.x,
    pointA.y,
    pointA.z,
    pointB.x,
    pointB.y,
    pointB.z,
    pointC.x,
    pointC.y,
    pointC.z,
    pointD.x,
    pointD.y,
    pointD.z,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
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
  const indentationSteps = deriveIndentationSteps(footprint);
  const zStep1 = indentationSteps[0];
  const zStep2 = indentationSteps[1];
  const frontZ = bounds.minZ;
  const joinZ = zStep1;
  const seamOverlap = 0.003;
  const mainRoofFrontZ = joinZ - seamOverlap;
  const ridgeBackZ = 8.45;
  const initialRightSegments = extractRightRoofSegments(footprint, ridgeX);
  const frontRightX = findRightXAtZ(initialRightSegments, bounds.minZ, bounds.maxX);
  const backRightX = findRightXAtZ(initialRightSegments, bounds.maxZ, bounds.maxX);
  const chamferedFootprint = chamferFootprint(footprint, bounds, frontRightX, backRightX);
  const rightSegments = extractRightRoofSegments(chamferedFootprint, ridgeX);
  const stepStartZ = getStepStartZ(rightSegments, bounds.maxX);

  console.log('ROOF +X segments', rightSegments);
  console.log('ROOF ridgeX', ridgeX);

  console.log('🏠 Roof anchored to eaves band at Y =', EAVES_Y);

  console.log('ROOF bounds', {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    depthZ: bounds.maxZ - bounds.minZ,
  });
  console.log('ROOF ridge', { ridgeX, ridgeY: MAIN_RIDGE_Y, minZ: bounds.minZ, maxZ: bounds.maxZ });
  console.log('Derived hip step lines', { zStep1, zStep2, mainRoofFrontZ, ridgeBackZ });
  console.log('FORCED mainRoofFrontZ/ridgeBackZ', { mainRoofFrontZ, ridgeBackZ });

  const ridgeYAtZ = (z: number) => {
    if (stepStartZ !== null && z >= stepStartZ) {
      return LOWER_RIDGE_Y;
    }
    return MAIN_RIDGE_Y;
  };

  const xRightAtZ = (z: number) => findRightXAtZ(rightSegments, z, bounds.maxX);

  const epsilon = 1e-4;

  const ridgeYFront = ridgeYAtZ(mainRoofFrontZ);
  const ridgeYBack = ridgeYAtZ(ridgeBackZ);
  const xRightBack = xRightAtZ(bounds.maxZ);
  const xRightBackInset = xRightAtZ(ridgeBackZ);
  const xRightFront = xRightAtZ(frontZ);
  const xRightJoin = xRightAtZ(joinZ);
  const miniLeftA = new THREE.Vector3(bounds.minX, EAVES_Y, frontZ);
  const miniLeftB = new THREE.Vector3(bounds.minX, EAVES_Y, joinZ);
  const miniLeftC = new THREE.Vector3(ridgeX, MINI_RIDGE_Y, joinZ);
  const miniLeftD = new THREE.Vector3(ridgeX, MINI_RIDGE_Y, frontZ);
  const miniRightA = new THREE.Vector3(xRightFront, EAVES_Y, frontZ);
  const miniRightB = new THREE.Vector3(xRightJoin, EAVES_Y, joinZ);
  const miniRightC = new THREE.Vector3(ridgeX, MINI_RIDGE_Y, joinZ);
  const miniRightD = new THREE.Vector3(ridgeX, MINI_RIDGE_Y, frontZ);

  const backRidgePoint = new THREE.Vector3(ridgeX, ridgeYBack, ridgeBackZ);
  const backMidEave = new THREE.Vector3(ridgeX, EAVES_Y, bounds.maxZ);
  const backLeftEave = new THREE.Vector3(bounds.minX, EAVES_Y, bounds.maxZ);
  const backRightEave = new THREE.Vector3(xRightBack, EAVES_Y, bounds.maxZ);
  const backLeftEaveInset = new THREE.Vector3(bounds.minX, EAVES_Y, ridgeBackZ);
  const backRightEaveInset = new THREE.Vector3(xRightBackInset, EAVES_Y, ridgeBackZ);

  const meshes = [
    {
      geometry: createRoofPlaneGeometry(
        bounds.minX,
        ridgeX,
        mainRoofFrontZ,
        ridgeBackZ,
        ridgeYFront,
        ridgeYBack
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    ...rightSegments
      .map((segment) => {
        const zStart = Math.max(segment.zStart, mainRoofFrontZ);
        const zEnd = Math.min(segment.zEnd, ridgeBackZ);
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
      geometry: createQuadGeometry(miniLeftA, miniLeftB, miniLeftC, miniLeftD),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createQuadGeometry(miniRightA, miniRightB, miniRightC, miniRightD),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backLeftEave, backRidgePoint, backMidEave),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backMidEave, backRidgePoint, backRightEave),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backLeftEave, backRidgePoint, backLeftEaveInset),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backLeftEave, backMidEave, backRidgePoint),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backMidEave, backRightEave, backRightEaveInset),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(backMidEave, backRightEaveInset, backRidgePoint),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  return { meshes };
}
