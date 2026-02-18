import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from 'three';

const EPSILON = 0.01;
import { RIGHT_FACADE_SEGMENTS } from '../windowsSide';

export type FacadePanel = {
  geometry: BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
};

/**
 * Filters an extruded geometry to only keep triangles lying on the
 * front face plane, back face plane, or both.
 */
export function filterExtrudedSideFaces(
  geometry: BufferGeometry,
  depth: number,
  context: string,
  keepPlane: 'front' | 'back' | 'both',
  enableBrickReturns: boolean
): BufferGeometry {
  if (enableBrickReturns) return geometry;

  const halfDepth = depth / 2;
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = source.getAttribute('position');
  const uv = source.getAttribute('uv');

  const keptPositions: number[] = [];
  const keptUvs: number[] = [];
  let removed = 0;
  let kept = 0;

  const triangleCount = position.count / 3;
  for (let tri = 0; tri < triangleCount; tri += 1) {
    const baseIndex = tri * 3;
    const indices = [baseIndex, baseIndex + 1, baseIndex + 2];

    const z1 = position.getZ(indices[0]);
    const z2 = position.getZ(indices[1]);
    const z3 = position.getZ(indices[2]);

    const onFront =
      Math.abs(z1 + halfDepth) < EPSILON &&
      Math.abs(z2 + halfDepth) < EPSILON &&
      Math.abs(z3 + halfDepth) < EPSILON;
    const onBack =
      Math.abs(z1 - halfDepth) < EPSILON &&
      Math.abs(z2 - halfDepth) < EPSILON &&
      Math.abs(z3 - halfDepth) < EPSILON;

    const keepThisTriangle = keepPlane === 'both' ? onFront || onBack : keepPlane === 'front' ? onFront : onBack;

    if (!keepThisTriangle) {
      removed += 1;
      continue;
    }

    indices.forEach((index) => {
      keptPositions.push(position.getX(index), position.getY(index), position.getZ(index));
      if (uv) {
        keptUvs.push(uv.getX(index), uv.getY(index));
      }
    });
    kept += 1;
  }

  const filtered = new BufferGeometry();
  filtered.setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
  if (uv && keptUvs.length > 0) {
    filtered.setAttribute('uv', new Float32BufferAttribute(keptUvs, 2));
  }
  filtered.computeVertexNormals();

  console.log('✅ FACADE FILTER', context, { depth, keepPlane, removedTriangles: removed, keptTriangles: kept });
  if (removed > 0) {
    console.log('🧱 DISABLED RETURN MESH', context, { depth, keepPlane, removedTriangles: removed, keptTriangles: kept });
  }

  return filtered;
}

/**
 * After filterExtrudedSideFaces, removes the inner depth plane so only
 * the outer face remains.
 */
export function keepOnlyOuterFacePlane(geometry: BufferGeometry, context: string): BufferGeometry {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = source.getAttribute('position');
  const uv = source.getAttribute('uv');

  const triCount = pos.count / 3;

  let maxProj = -Infinity;
  let minProj = Infinity;
  const triProj: number[] = new Array(triCount);

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const z0 = pos.getZ(i0);
    const z1 = pos.getZ(i1);
    const z2 = pos.getZ(i2);
    const proj = (z0 + z1 + z2) / 3;

    triProj[t] = proj;
    if (proj > maxProj) maxProj = proj;
    if (proj < minProj) minProj = proj;
  }

  const EPS = 1e-3;
  const keptPos: number[] = [];
  const keptUv: number[] = [];

  let removed = 0;
  let kept = 0;

  for (let t = 0; t < triCount; t++) {
    const proj = triProj[t];

    if (Math.abs(proj - maxProj) > EPS) {
      removed++;
      continue;
    }

    kept++;
    const i0 = t * 3;
    for (let k = 0; k < 3; k++) {
      const idx = i0 + k;
      keptPos.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
      if (uv) keptUv.push(uv.getX(idx), uv.getY(idx));
    }
  }

  const out = new BufferGeometry();
  out.setAttribute('position', new Float32BufferAttribute(keptPos, 3));
  if (uv && keptUv.length) out.setAttribute('uv', new Float32BufferAttribute(keptUv, 2));
  out.computeVertexNormals();

  console.log('✅ KEEP OUTER FACE ONLY', context, { removedTriangles: removed, keptTriangles: kept, maxProj, minProj });
  return out;
}

/**
 * Returns the RIGHT_FACADE_SEGMENT that contains the given Z coordinate.
 */
export function segmentForZ(zCenter: number): (typeof RIGHT_FACADE_SEGMENTS)[number] {
  if (zCenter < 4.0) return RIGHT_FACADE_SEGMENTS[0];
  if (zCenter < 8.45) return RIGHT_FACADE_SEGMENTS[1];
  return RIGHT_FACADE_SEGMENTS[2];
}

/**
 * Builds the right facade return (horizontal step) panels from a
 * facade profile.
 */
export function buildRightFacadeReturnPanels(params: {
  profile: { z: number; x: number }[];
  y0: number;
  y1: number;
  thickness: number;
  zOffset?: number;
}): FacadePanel[] {
  const { profile, y0, y1, thickness, zOffset = 0.002 } = params;

  const panels: FacadePanel[] = [];
  if (!profile || profile.length < 2) return panels;

  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];

    if (Math.abs(a.x - b.x) < 1e-6) continue;

    const zStep = b.z;
    const xMin = Math.min(a.x, b.x);
    const xMax = Math.max(a.x, b.x);
    const widthX = xMax - xMin;
    const heightY = y1 - y0;

    const solidGeom = new BoxGeometry(widthX, heightY, thickness);
    panels.push({
      geometry: solidGeom,
      position: [(xMin + xMax) / 2, (y0 + y1) / 2, zStep - zOffset],
      rotation: [0, 0, 0],
    });
  }

  return panels;
}
