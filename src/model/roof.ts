import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;
const LOWER_RIDGE_Y = 9.45;
const CHAMFER_Z = 0.4;
const HIP_INSET_Z = 0.6;
const GABLE_INSET_X = 0.6;

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

function createSlantedEndGeometry(
  xLeftBottom: number,
  xRightBottom: number,
  xRightTop: number,
  xLeftTop: number,
  eavesY: number,
  ridgeY: number,
  z: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    xLeftBottom,
    eavesY,
    z,
    xRightBottom,
    eavesY,
    z,
    xRightTop,
    ridgeY,
    z,
    xLeftTop,
    ridgeY,
    z,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 2, 1, 0, 3, 2, 0]);
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

  const frontZ = bounds.minZ;
  const backZ = bounds.maxZ;
  const ridgeFrontZ = bounds.minZ + HIP_INSET_Z;
  const ridgeBackZ = bounds.maxZ - HIP_INSET_Z;

  console.log('HIP_INSET_Z', HIP_INSET_Z, { ridgeFrontZ, ridgeBackZ });

  const ridgeYAtZ = (z: number) => {
    if (stepStartZ !== null && z >= stepStartZ) {
      return LOWER_RIDGE_Y;
    }
    return MAIN_RIDGE_Y;
  };

  const xRightAtZ = (z: number) => findRightXAtZ(rightSegments, z, bounds.maxX);

  const epsilon = 1e-4;
  const endFaceOffset = 0.01;

  const buildSlantedEndFace = (zFacade: number) => {
    const yR = ridgeYAtZ(zFacade);
    const xLBottom = bounds.minX;
    const xRBottom = xRightAtZ(zFacade);
    let xLTop = xLBottom + GABLE_INSET_X;
    let xRTop = xRBottom - GABLE_INSET_X;

    xLTop = Math.min(xLTop, ridgeX - epsilon);
    xRTop = Math.max(xRTop, ridgeX + epsilon);

    if (xRTop - xLTop <= 0.2) {
      xLTop = ridgeX - 0.11;
      xRTop = ridgeX + 0.11;
    }

    const zOffset = Math.abs(zFacade - bounds.minZ) < epsilon ? -endFaceOffset : endFaceOffset;

    return {
      geometry: createSlantedEndGeometry(
        xLBottom,
        xRBottom,
        xRTop,
        xLTop,
        EAVES_Y,
        yR,
        zFacade + zOffset
      ),
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  };

  console.log('Slanted end faces', { GABLE_INSET_X, minZ: bounds.minZ, maxZ: bounds.maxZ });

  const meshes = [
    {
      geometry: createRoofPlaneGeometry(
        bounds.minX,
        ridgeX,
        ridgeFrontZ,
        ridgeBackZ,
        MAIN_RIDGE_Y,
        MAIN_RIDGE_Y
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    ...rightSegments
      .map((segment) => {
        const zStart = Math.max(segment.zStart, ridgeFrontZ);
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
    buildSlantedEndFace(frontZ),
    buildSlantedEndFace(backZ),
  ];

  return { meshes };
}
