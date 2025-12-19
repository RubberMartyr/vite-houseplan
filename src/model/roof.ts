import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;
const LOWER_RIDGE_Y = 9.45;
const CHAMFER_Z = 0.4;
const X_AT_Z_EPS = 1e-6;
const loggedXAtZ = new Set<string>();

function xAtZ(
  points: FootprintPoint[],
  z: number,
  side: 'min' | 'max',
  bounds: { minX: number; maxX: number }
): { x: number; usedFallback: boolean } {
  const xs: number[] = [];
  const n = points.length;

  if (n === 0) {
    return { x: side === 'min' ? bounds.minX : bounds.maxX, usedFallback: true };
  }

  const lastIsFirst =
    Math.abs(points[0].x - points[n - 1].x) < X_AT_Z_EPS &&
    Math.abs(points[0].z - points[n - 1].z) < X_AT_Z_EPS;
  const m = lastIsFirst ? n - 1 : n;

  for (let i = 0; i < m; i++) {
    const p = points[i];
    const q = points[(i + 1) % m];

    if (Math.abs(p.z - z) < X_AT_Z_EPS) {
      xs.push(p.x);
    }

    if (Math.abs(p.z - q.z) < X_AT_Z_EPS) {
      if (Math.abs(z - p.z) < X_AT_Z_EPS) {
        xs.push(p.x, q.x);
      }
      continue;
    }

    const minZ = Math.min(p.z, q.z) - X_AT_Z_EPS;
    const maxZ = Math.max(p.z, q.z) + X_AT_Z_EPS;
    if (z < minZ || z > maxZ) {
      continue;
    }

    const denom = q.z - p.z;
    if (Math.abs(denom) < X_AT_Z_EPS) {
      continue;
    }

    const t = (z - p.z) / denom;
    const x = p.x + t * (q.x - p.x);
    if (Number.isFinite(x)) {
      xs.push(x);
    }
  }

  const finiteXs = xs.filter((value) => Number.isFinite(value));
  if (finiteXs.length < 2) {
    const key = z.toFixed(6);
    if (!loggedXAtZ.has(key)) {
      loggedXAtZ.add(key);
      console.log('xAtZ fallback', { z, side, count: finiteXs.length });
    }
    return { x: side === 'min' ? bounds.minX : bounds.maxX, usedFallback: true };
  }

  return {
    x: side === 'min' ? Math.min(...finiteXs) : Math.max(...finiteXs),
    usedFallback: false,
  };
}

function xAtZSafe(
  points: FootprintPoint[],
  z: number,
  side: 'min' | 'max',
  minZ: number,
  maxZ: number
): number {
  const EPS = 1e-3;
  const MAX_TRIES = 20;
  const bounds = computeBounds(points);

  for (let i = 0; i <= MAX_TRIES; i++) {
    const dz = i * EPS;
    let zTry = z;

    if (Math.abs(z - minZ) < 1e-6) {
      zTry = z + dz;
    } else if (Math.abs(z - maxZ) < 1e-6) {
      zTry = z - dz;
    } else {
      zTry = z + (i === 0 ? 0 : i % 2 ? dz : -dz);
    }

    const res = xAtZ(points, zTry, side, bounds);
    if (!res.usedFallback && Number.isFinite(res.x)) {
      return res.x;
    }
  }

  console.warn('xAtZSafe failed; using hard fallback', { z, side });
  const fallback = side === 'min' ? Math.min(...points.map((p) => p.x)) : Math.max(...points.map((p) => p.x));
  return fallback;
}

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

function createRoofPlaneGeometryVariableEave(
  eaveXStart: number,
  eaveXEnd: number,
  ridgeX: number,
  zStart: number,
  zEnd: number,
  ridgeYStart: number,
  ridgeYEnd: number
): THREE.BufferGeometry {
  const a = new THREE.Vector3(eaveXStart, EAVES_Y, zStart);
  const b = new THREE.Vector3(eaveXEnd, EAVES_Y, zEnd);
  const c = new THREE.Vector3(ridgeX, ridgeYEnd, zEnd);
  const d = new THREE.Vector3(ridgeX, ridgeYStart, zStart);

  const vertices = new Float32Array([
    a.x,
    a.y,
    a.z,
    b.x,
    b.y,
    b.z,
    c.x,
    c.y,
    c.z,
    a.x,
    a.y,
    a.z,
    c.x,
    c.y,
    c.z,
    d.x,
    d.y,
    d.z,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
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
  const ridgeFrontZ = 4.0;
  const ridgeBackZ = 8.45;
  const initialRightSegments = extractRightRoofSegments(footprint, ridgeX);
  const frontRightChamferX = findRightXAtZ(initialRightSegments, bounds.minZ, bounds.maxX);
  const backRightChamferX = findRightXAtZ(initialRightSegments, bounds.maxZ, bounds.maxX);
  const chamferedFootprint = chamferFootprint(footprint, bounds, frontRightChamferX, backRightChamferX);
  const rightSegments = extractRightRoofSegments(chamferedFootprint, ridgeX);
  const stepStartZ = getStepStartZ(rightSegments, bounds.maxX);
  const xLeftFront = xAtZSafe(chamferedFootprint, bounds.minZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftFrontInset = xAtZSafe(chamferedFootprint, ridgeFrontZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftBackInset = xAtZSafe(chamferedFootprint, ridgeBackZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftBack = xAtZSafe(chamferedFootprint, bounds.maxZ, 'min', bounds.minZ, bounds.maxZ);

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
  console.log('Derived hip step lines', { zStep1, zStep2, ridgeFrontZ, ridgeBackZ });
  console.log('FORCED ridgeFrontZ/ridgeBackZ', { ridgeFrontZ, ridgeBackZ });

  const ridgeYAtZ = (z: number) => {
    if (stepStartZ !== null && z >= stepStartZ) {
      return LOWER_RIDGE_Y;
    }
    return MAIN_RIDGE_Y;
  };

  const epsilon = 1e-4;

  const ridgeYFront = ridgeYAtZ(ridgeFrontZ);
  const ridgeYBack = ridgeYAtZ(ridgeBackZ);
  const frontRightX = xAtZSafe(chamferedFootprint, bounds.minZ, 'max', bounds.minZ, bounds.maxZ);
  const backRightX = xAtZSafe(chamferedFootprint, bounds.maxZ, 'max', bounds.minZ, bounds.maxZ);
  const frontRightInsetX = xAtZSafe(chamferedFootprint, ridgeFrontZ, 'max', bounds.minZ, bounds.maxZ);
  const backRightInsetX = xAtZSafe(chamferedFootprint, ridgeBackZ, 'max', bounds.minZ, bounds.maxZ);
  const zCuts = [bounds.minZ, ridgeFrontZ, ridgeBackZ, bounds.maxZ];

  console.log('xAtZ debug', {
    zFront: bounds.minZ,
    zBack: bounds.maxZ,
    ridgeFrontZ,
    ridgeBackZ,
    xLeftFront,
    xLeftFrontInset,
    xLeftBackInset,
    xLeftBack,
    frontRightX,
    frontRightInsetX,
    backRightInsetX,
    backRightX,
  });
  console.log('LEFT roof rebuilt using xAtZSafe over zCuts', zCuts);
  console.log('LEFT roof uses variable eave X:', {
    xLeftFront,
    xLeftFrontInset,
    xLeftBackInset,
    xLeftBack,
  });

  const frontRidgePoint = new THREE.Vector3(ridgeX, ridgeYFront, ridgeFrontZ);
  const frontMidEave = new THREE.Vector3(ridgeX, EAVES_Y, bounds.minZ);
  const frontLeftEave = new THREE.Vector3(xLeftFront, EAVES_Y, bounds.minZ);
  const frontRightEave = new THREE.Vector3(frontRightX, EAVES_Y, bounds.minZ);
  const frontLeftEaveInset = new THREE.Vector3(xLeftFrontInset, EAVES_Y, ridgeFrontZ);
  const frontRightEaveInset = new THREE.Vector3(frontRightInsetX, EAVES_Y, ridgeFrontZ);

  const backRidgePoint = new THREE.Vector3(ridgeX, ridgeYBack, ridgeBackZ);
  const backMidEave = new THREE.Vector3(ridgeX, EAVES_Y, bounds.maxZ);
  const backLeftEave = new THREE.Vector3(xLeftBack, EAVES_Y, bounds.maxZ);
  const backRightEave = new THREE.Vector3(backRightX, EAVES_Y, bounds.maxZ);
  const backLeftEaveInset = new THREE.Vector3(xLeftBackInset, EAVES_Y, ridgeBackZ);
  const backRightEaveInset = new THREE.Vector3(backRightInsetX, EAVES_Y, ridgeBackZ);

  const leftSegments = [
    {
      geometry: createRoofPlaneGeometryVariableEave(
        xLeftFront,
        xLeftFrontInset,
        ridgeX,
        bounds.minZ,
        ridgeFrontZ,
        ridgeYAtZ(bounds.minZ),
        ridgeYAtZ(ridgeFrontZ)
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createRoofPlaneGeometryVariableEave(
        xLeftFrontInset,
        xLeftBackInset,
        ridgeX,
        ridgeFrontZ,
        ridgeBackZ,
        ridgeYAtZ(ridgeFrontZ),
        ridgeYAtZ(ridgeBackZ)
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createRoofPlaneGeometryVariableEave(
        xLeftBackInset,
        xLeftBack,
        ridgeX,
        ridgeBackZ,
        bounds.maxZ,
        ridgeYAtZ(ridgeBackZ),
        ridgeYAtZ(bounds.maxZ)
      ),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  const meshes = [
    ...leftSegments,
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
    {
      geometry: createTriangleGeometry(frontLeftEave, frontMidEave, frontRidgePoint),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontMidEave, frontRightEave, frontRidgePoint),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontLeftEave, frontLeftEaveInset, frontRidgePoint),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontLeftEave, frontRidgePoint, frontMidEave),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontMidEave, frontRidgePoint, frontRightEaveInset),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontMidEave, frontRightEaveInset, frontRightEave),
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
