import * as THREE from 'three';
import { FootprintPoint, getEnvelopeOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const MAIN_RIDGE_Y = 9.85;
const LOWER_RIDGE_Y = 9.45;
const CHAMFER = 0.4;
const MAIN_PITCHED_DEPTH = 12.0; // meters
const STEP_BACK_WIDTH = 7.6; // meters (rear width where pitched roof stops)
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

function makeTri(pointA: THREE.Vector3, pointB: THREE.Vector3, pointC: THREE.Vector3): THREE.BufferGeometry {
  return createTriangleGeometry(pointA, pointB, pointC);
}

function chamferFootprint(
  points: FootprintPoint[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  frontRightX: number,
  backRightX: number,
  chamfer: number
): FootprintPoint[] {
  const epsilon = 1e-4;
  const frontZ = bounds.minZ + chamfer;
  const backZ = bounds.maxZ - chamfer;

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

function chamferPolygon(points: FootprintPoint[], chamfer: number): FootprintPoint[] {
  const bounds = computeBounds(points);
  const ridgeX = (bounds.minX + bounds.maxX) / 2;
  const rightSegments = extractRightRoofSegments(points, ridgeX);
  const frontRightChamferX = findRightXAtZ(rightSegments, bounds.minZ, bounds.maxX);
  const backRightChamferX = findRightXAtZ(rightSegments, bounds.maxZ, bounds.maxX);
  return chamferFootprint(points, bounds, frontRightChamferX, backRightChamferX, chamfer);
}

type RoofMeshSegment = {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  debugColor?: string;
};

export function buildRoofMeshes(): { meshes: RoofMeshSegment[] } {
  const envelopeOuter = getEnvelopeOuterPolygon();
  const groundFootprint = envelopeOuter;
  const groundBounds = computeBounds(groundFootprint);
  let mainPts = envelopeOuter;

  function isValidFootprint(pts: any[]) {
    if (!Array.isArray(pts) || pts.length < 4) return false;
    const first = pts[0],
      last = pts[pts.length - 1];
    if (!first || !last) return false;
    if (Math.abs(first.x - last.x) > 1e-6 || Math.abs(first.z - last.z) > 1e-6) return false;
    for (const p of pts) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return false;
    }
    return true;
  }

  if (!isValidFootprint(mainPts)) {
    console.warn('❌ Invalid first-floor roof footprint, falling back to ground envelope', {
      envelopeFirstOuter: mainPts,
    });
    mainPts = envelopeOuter;
  }
  if (!isValidFootprint(mainPts)) {
    throw new Error(
      'Roof footprint invalid even after fallback. Check envelope point arrays (must be closed, finite, in meters).'
    );
  }

  const mainFootprint = chamferPolygon(mainPts, CHAMFER);
  const mainBounds = computeBounds(mainFootprint);
  console.log('✅ ROOF FOOTPRINT OK', {
    count: mainPts.length,
    first: mainPts[0],
    last: mainPts[mainPts.length - 1],
  });
  const bounds = {
    minX: mainBounds.minX,
    maxX: mainBounds.maxX,
    minZ: mainBounds.minZ,
    maxZ: mainBounds.maxZ,
  };
  const baseFrontZ = bounds.minZ;
  const mainBackZ = baseFrontZ + MAIN_PITCHED_DEPTH;
  console.log('✅ MAIN ROOF FOOTPRINT = FIRST FLOOR', { mainBounds, groundBounds });
  const ridgeX = (bounds.minX + bounds.maxX) / 2;
  console.log('✅ ROOF RESTORED (constants)', { frontZ: baseFrontZ, mainBackZ, ridgeX, width: STEP_BACK_WIDTH });
  const indentationSteps = deriveIndentationSteps(mainFootprint);
  const zStep1 = indentationSteps[0];
  const zStep2 = indentationSteps[1];
  const ridgeFrontZ = 4.0;
  const ridgeBackZ = Math.min(8.45, mainBackZ);
  const eaveBackZ =
    Math.abs(bounds.minZ - mainBackZ) < Math.abs(bounds.maxZ - mainBackZ)
      ? bounds.minZ
      : bounds.maxZ;
  console.log('✅ BACK ENDCAP EDGE PICK', { mainBackZ, minZ: bounds.minZ, maxZ: bounds.maxZ, eaveBackZ });
  console.log('✅ BACK ENDCAP ANCHOR', {
    mainBackZ,
    eaveBackZ,
    baseFrontZ,
    ridgeFrontZ,
  });
  const rightSegments = extractRightRoofSegments(mainFootprint, ridgeX);
  const stepStartZ = getStepStartZ(rightSegments, bounds.maxX);
  const xLeftFront = xAtZSafe(mainFootprint, baseFrontZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftFrontInset = xAtZSafe(mainFootprint, ridgeFrontZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftBackInset = xAtZSafe(mainFootprint, ridgeBackZ, 'min', bounds.minZ, bounds.maxZ);
  const xLeftBack = xAtZSafe(mainFootprint, mainBackZ, 'min', bounds.minZ, bounds.maxZ);

  console.log('ROOF +X segments', rightSegments);
  console.log('ROOF ridgeX', ridgeX);

  console.log('🏠 Roof anchored to eaves band at Y =', EAVES_Y);

  console.log('ROOF bounds original', groundBounds);
  console.log('ROOF bounds chamfered', mainBounds);
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

  const xRightFront = xAtZSafe(mainFootprint, baseFrontZ, 'max', bounds.minZ, bounds.maxZ);
  const xRightBack = xAtZSafe(mainFootprint, mainBackZ, 'max', bounds.minZ, bounds.maxZ);
  const xRightFrontInset = xAtZSafe(mainFootprint, ridgeFrontZ, 'max', bounds.minZ, bounds.maxZ);
  const xRightBackInset = xAtZSafe(mainFootprint, ridgeBackZ, 'max', bounds.minZ, bounds.maxZ);
  const zCuts = [baseFrontZ, ridgeFrontZ, ridgeBackZ, mainBackZ];

  console.log('xAtZ debug', {
    zFront: baseFrontZ,
    zBack: mainBackZ,
    ridgeFrontZ,
    ridgeBackZ,
    xLeftFront,
    xLeftFrontInset,
    xLeftBackInset,
    xLeftBack,
    xRightFront,
    xRightBack,
    xRightBackInset,
  });
  console.log('LEFT roof rebuilt using xAtZSafe over zCuts', zCuts);
  console.log('LEFT roof uses variable eave X:', {
    xLeftFront,
    xLeftFrontInset,
    xLeftBackInset,
    xLeftBack,
  });
  console.log('LEFT roof fixed: variable eave X', {
    xLeftFront,
    xLeftFrontInset,
    xLeftBackInset,
    xLeftBack,
  });

  const eavesY = EAVES_Y;
  const rearZ = mainBackZ;
  const ridgeY = ridgeYAtZ(rearZ);
  const frontLeftEave = new THREE.Vector3(xLeftFront, eavesY, baseFrontZ);
  const frontLeftEaveInset = new THREE.Vector3(xLeftFrontInset, eavesY, ridgeFrontZ);
  const frontRightEave = new THREE.Vector3(xRightFront, eavesY, baseFrontZ);
  const frontRightEaveInset = new THREE.Vector3(xRightFrontInset, eavesY, ridgeFrontZ);
  const zEave = mainBackZ;
  const backLeftEave = new THREE.Vector3(
    xAtZSafe(mainFootprint, mainBackZ, 'min', bounds.minZ, bounds.maxZ),
    eavesY,
    zEave
  );
  const backRightEave = new THREE.Vector3(
    xAtZSafe(mainFootprint, mainBackZ, 'max', bounds.minZ, bounds.maxZ),
    eavesY,
    zEave
  );
  const backLeftEaveInset = new THREE.Vector3(xLeftBackInset, eavesY, ridgeBackZ);
  const backRightEaveInset = new THREE.Vector3(xRightBackInset, eavesY, ridgeBackZ);
  const backMidEave = new THREE.Vector3(ridgeX, eavesY, mainBackZ);
  const backRidgePoint = new THREE.Vector3(ridgeX, ridgeYAtZ(mainBackZ), mainBackZ);

  const ridgeFrontPoint = new THREE.Vector3(ridgeX, ridgeYAtZ(ridgeFrontZ), ridgeFrontZ);
  const ridgeBackPoint = new THREE.Vector3(ridgeX, ridgeY, rearZ);
  console.log('✅ BACK HIP ENDCAP (mirrored)', {
    mainBackZ,
    baseFrontZ,
    ridgeFrontZ,
    ridgeBackPoint,
  });

  const frontEndcap = {
    geometry: createTriangleGeometry(frontLeftEave, ridgeFrontPoint, frontRightEave),
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  };

  console.log('BACK CAP PTS', {
    backLeftEave,
    backRightEave,
    backLeftEaveInset,
    backRightEaveInset,
    backRidgePoint,
  });

  const backEndcap = [
    {
      geometry: createTriangleGeometry(backLeftEave, backMidEave, backRidgePoint),
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    {
      geometry: createTriangleGeometry(backMidEave, backRightEave, backRidgePoint),
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
  ];

  console.log('✅ BACK HIP END', {
    eavesY,
    ridgeY,
    rearZ,
    backLeftEave,
    backRightEave,
    backLeftEaveInset,
    backRightEaveInset,
  });

  const leftRoofMeshes = [
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
  ];

  const hipMeshes = [
    {
      geometry: createTriangleGeometry(frontLeftEave, ridgeFrontPoint, frontLeftEaveInset),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    {
      geometry: createTriangleGeometry(frontRightEaveInset, ridgeFrontPoint, frontRightEave),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  const gableMeshes = [
    {
      geometry: createTriangleGeometry(frontLeftEaveInset, ridgeFrontPoint, frontRightEaveInset),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ];

  console.log('HIP MESHES now FRONT only (back handled by backEndcap)');
  console.log('HIP ROOF active', {
    ridgeFrontZ,
    ridgeBackZ,
    xLeftFront,
    xLeftFrontInset,
    xRightFront,
    xRightFrontInset,
  });
  console.log('FRONT ENDCAP ACTIVE', { xLeftFront, xRightFront, ridgeFrontZ });
  console.log('✅ BACK ENDCAP ADDED ONCE', {
    rearZ: mainBackZ,
    backLeftEave,
    backRightEave,
    ridgeBackPoint,
  });

  const meshes = [
    ...leftRoofMeshes,
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
      .filter((mesh): mesh is RoofMeshSegment => Boolean(mesh)),
    frontEndcap,
    ...gableMeshes,
    ...hipMeshes,
    ...backEndcap,
  ];

  console.log('✅ GABLES ADDED', {
    ridgeFrontPoint,
    ridgeBackPoint,
    frontLeftEaveInset,
    frontRightEaveInset,
    backLeftEave,
    backRightEave,
    frontZ: baseFrontZ,
    rearZ: mainBackZ,
  });

  console.log('✅ ROOF MESH COUNT', meshes.length);
  return { meshes };
}
