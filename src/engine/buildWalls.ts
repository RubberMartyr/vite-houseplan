import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon, getFlatRoofPolygon } from '../model/envelope';
import { ceilingHeights, rightFacadeProfileCm, wallThickness } from '../model/houseSpec';
import { ARCH_RIGHT_FACADE_SEGMENTS, RIGHT_WORLD_FACADE_SEGMENTS } from '../model/builders/windowFactory';
import { createFacadeContext } from '../model/builders/facadeContext';
import { getWallPlanesAtZ } from '../model/builders/wallSurfaceResolver';
import { buildExtrudedShell } from '../model/builders/buildExtrudedShell';

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const EPSILON = 0.01;

type WallMesh = {
  geometry: BufferGeometry;
  role?: 'shell' | 'facade';
};

type FacadeSegment = { x: number; z0: number; z1: number };

function getFacadeXExtremesAtZ(poly: { x: number; z: number }[], zQuery: number) {
  const xs: number[] = [];

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin - EPSILON || zQuery > zMax + EPSILON) continue;

    if (Math.abs(a.z - b.z) < EPSILON) {
      if (Math.abs(zQuery - a.z) < EPSILON) {
        xs.push(a.x, b.x);
      }
      continue;
    }

    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);
    xs.push(x);
  }

  if (!xs.length) return null;
  return { minX: Math.min(...xs), maxX: Math.max(...xs), xs };
}

function profileCmToSegments(profileCm: { x: number; z: number }[]): FacadeSegment[] {
  const segments: FacadeSegment[] = [];

  for (let i = 0; i < profileCm.length - 1; i += 1) {
    const a = profileCm[i];
    const b = profileCm[i + 1];

    if (Math.abs(a.x - b.x) > 1e-6) continue;

    const x = a.x / 100;
    const z0 = Math.min(a.z, b.z) / 100;
    const z1 = Math.max(a.z, b.z) / 100;

    segments.push({ x, z0, z1 });
  }

  return segments;
}

const EXTENSION_SIDE_WALL = (() => {
  const segments = profileCmToSegments(rightFacadeProfileCm);
  if (!segments.length) return null;

  const minX = segments.reduce((min, seg) => Math.min(min, seg.x), Infinity);
  const candidates = segments
    .filter((seg) => Math.abs(seg.x - minX) < EPSILON)
    .sort((a, b) => {
      if (Math.abs(a.z0 - b.z0) > EPSILON) return a.z0 - b.z0;
      return a.z1 - a.z0 - (b.z1 - b.z0);
    });

  const raw = candidates[0];

  const z0 = raw.z0;
  const z1 = raw.z1;

  const outer = getEnvelopeOuterPolygon();
  const envMinX = outer.reduce((m, p) => Math.min(m, p.x), Infinity);
  const envMaxX = outer.reduce((m, p) => Math.max(m, p.x), -Infinity);

  const zMid = (z0 + z1) / 2;
  const slice = getFacadeXExtremesAtZ(outer, zMid);

  let x = raw.x;

  if (slice) {
    const { minX: sliceMinX, maxX: sliceMaxX } = slice;

    const rightStepsIn = sliceMaxX < envMaxX - 0.05;
    const leftStepsIn = sliceMinX > envMinX + 0.05;

    if (rightStepsIn && !leftStepsIn) {
      x = sliceMaxX;
    } else if (leftStepsIn && !rightStepsIn) {
      x = sliceMinX;
    } else {
      const flat = getFlatRoofPolygon();
      const flatMinX = flat.reduce((m, p) => Math.min(m, p.x), Infinity);
      const flatMaxX = flat.reduce((m, p) => Math.max(m, p.x), -Infinity);

      const dToRight = Math.abs(sliceMaxX - flatMaxX);
      const dToLeft = Math.abs(sliceMinX - flatMinX);

      x = dToRight <= dToLeft ? sliceMaxX : sliceMinX;
    }
  }

  return { x, z0, z1 };
})();

type WallGeometryData = {
  positions: number[];
  uvs: number[];
  normals: number[];
  indices: null;
};

export function buildWallsFromCurrentSystem() {
  const outer = getEnvelopeOuterPolygon();
  const inner = getEnvelopeInnerPolygon(exteriorThickness);
  const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
  const innerRearZ = rearZ - exteriorThickness;
  const facadeCtx = createFacadeContext('architecturalLeft');
  const frontZ = outer.reduce((min, point) => Math.min(min, point.z), Infinity);
  const innerFrontZ = frontZ + exteriorThickness;

  const raw = buildExtrudedShell({
    outerPoints: outer,
    innerPoints: inner,
    height: wallHeight,
    baseY: 0,
  });
  const geometry = raw.geometry;

  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = g.getAttribute('position');
  const uv = g.getAttribute('uv');

  const keptPositions: number[] = [];
  const keptUvs: number[] = [];
  const mesh: WallMesh = { geometry, role: 'shell' };
  const triangleCount = position.count / 3;
  const rightFacadeCtx = createFacadeContext('architecturalLeft');
  const leftFacadeCtx = createFacadeContext('architecturalRight');
  const extensionFacadeCtx = createFacadeContext('architecturalRight');
  for (let tri = 0; tri < triangleCount; tri += 1) {
    const baseIndex = tri * 3;
    const indices = [baseIndex, baseIndex + 1, baseIndex + 2];

    const x1 = position.getX(indices[0]);
    const y1 = position.getY(indices[0]);
    const z1 = position.getZ(indices[0]);

    const x2 = position.getX(indices[1]);
    const y2 = position.getY(indices[1]);
    const z2 = position.getZ(indices[1]);

    const x3 = position.getX(indices[2]);
    const y3 = position.getY(indices[2]);
    const z3 = position.getZ(indices[2]);

    const v1 = new Vector3(x1, y1, z1);
    const v2 = new Vector3(x2, y2, z2);
    const v3 = new Vector3(x3, y3, z3);

    const e1 = new Vector3().subVectors(v2, v1);
    const e2 = new Vector3().subVectors(v3, v1);
    const n = new Vector3().crossVectors(e1, e2).normalize();

    const facesMostlyX = Math.abs(n.x) > 0.85;
    const facesMostlyZ = Math.abs(n.z) > 0.85;

    const onRearOuter =
      facesMostlyZ &&
      Math.abs(z1 - rearZ) < EPSILON &&
      Math.abs(z2 - rearZ) < EPSILON &&
      Math.abs(z3 - rearZ) < EPSILON;
    const onFrontOuter =
      facesMostlyZ &&
      Math.abs(z1 - frontZ) < EPSILON &&
      Math.abs(z2 - frontZ) < EPSILON &&
      Math.abs(z3 - frontZ) < EPSILON;
    const onRearInner =
      facesMostlyZ &&
      Math.abs(z1 - innerRearZ) < EPSILON &&
      Math.abs(z2 - innerRearZ) < EPSILON &&
      Math.abs(z3 - innerRearZ) < EPSILON;
    const onFrontInner =
      facesMostlyZ &&
      Math.abs(z1 - innerFrontZ) < EPSILON &&
      Math.abs(z2 - innerFrontZ) < EPSILON &&
      Math.abs(z3 - innerFrontZ) < EPSILON;
    const zMid = (z1 + z2 + z3) / 3;
    const { xOuter: xWallAtZ, xInner: xInnerWallAtZ } = getWallPlanesAtZ(
      facadeCtx.outward as 1 | -1,
      zMid,
      exteriorThickness
    );

    const onLeftOuter =
      facesMostlyX &&
      Math.abs(x1 - xWallAtZ) < EPSILON &&
      Math.abs(x2 - xWallAtZ) < EPSILON &&
      Math.abs(x3 - xWallAtZ) < EPSILON;
    const onLeftInner =
      facesMostlyX &&
      Math.abs(x1 - xInnerWallAtZ) < EPSILON &&
      Math.abs(x2 - xInnerWallAtZ) < EPSILON &&
      Math.abs(x3 - xInnerWallAtZ) < EPSILON;
    const triZMin = Math.min(z1, z2, z3);
    const triZMax = Math.max(z1, z2, z3);
    let onRightSegment = false;
    let onLeftSegment = false;
    if (mesh.role === 'facade') {
      onRightSegment =
        facesMostlyX &&
        RIGHT_WORLD_FACADE_SEGMENTS.some((segment) => {
          const outerX = segment.x;
          const innerX = outerX - rightFacadeCtx.outward * exteriorThickness;
          const onOuterX =
            Math.abs(x1 - outerX) < EPSILON &&
            Math.abs(x2 - outerX) < EPSILON &&
            Math.abs(x3 - outerX) < EPSILON;
          const onInnerX =
            Math.abs(x1 - innerX) < EPSILON &&
            Math.abs(x2 - innerX) < EPSILON &&
            Math.abs(x3 - innerX) < EPSILON;
          if (!onOuterX && !onInnerX) return false;

          const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin < segment.z1 - EPSILON;
          return inSegmentZ;
        });

      onLeftSegment =
        facesMostlyX &&
        ARCH_RIGHT_FACADE_SEGMENTS.some((segment) => {
          const outerX = segment.x;
          const innerX = outerX - leftFacadeCtx.outward * exteriorThickness;
          const onOuterX =
            Math.abs(x1 - outerX) < EPSILON &&
            Math.abs(x2 - outerX) < EPSILON &&
            Math.abs(x3 - outerX) < EPSILON;
          const onInnerX =
            Math.abs(x1 - innerX) < EPSILON &&
            Math.abs(x2 - innerX) < EPSILON &&
            Math.abs(x3 - innerX) < EPSILON;
          if (!onOuterX && !onInnerX) return false;

          const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin < segment.z1 - EPSILON;
          return inSegmentZ;
        });
    }
    const onLeftFacadeSegment = onLeftOuter || onLeftInner;

    const extensionSeg = EXTENSION_SIDE_WALL;

    const triXMin = Math.min(x1, x2, x3);
    const triXMax = Math.max(x1, x2, x3);

    const inExtensionZ =
      !!extensionSeg && triZMax >= extensionSeg.z0 - EPSILON && triZMin <= extensionSeg.z1 + EPSILON;

    const extensionOuterX = extensionSeg?.x ?? 0;
    const extensionInnerX = extensionSeg
      ? extensionOuterX - extensionFacadeCtx.outward * exteriorThickness
      : 0;

    const bandMinX = Math.min(extensionOuterX, extensionInnerX) - EPSILON;
    const bandMaxX = Math.max(extensionOuterX, extensionInnerX) + EPSILON;

    const inExtensionXBand = !!extensionSeg && triXMax >= bandMinX && triXMin <= bandMaxX;

    const isExtensionLeftWallTriangle = false;

    const shouldRemove =
      !isExtensionLeftWallTriangle &&
      (onRearOuter ||
        onRearInner ||
        onFrontOuter ||
        onFrontInner ||
        onRightSegment ||
        onLeftSegment ||
        onLeftFacadeSegment);

    if (shouldRemove) {
      continue;
    }

    indices.forEach((index) => {
      keptPositions.push(position.getX(index), position.getY(index), position.getZ(index));
      if (uv) {
        keptUvs.push(uv.getX(index), uv.getY(index));
      }
    });
  }

  const filteredGeometry = new BufferGeometry();
  filteredGeometry.setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
  if (uv && keptUvs.length > 0) {
    filteredGeometry.setAttribute('uv', new Float32BufferAttribute(keptUvs, 2));
  }
  filteredGeometry.computeVertexNormals();

  const normalsAttr = filteredGeometry.getAttribute('normal');

  const shellGeometry: WallGeometryData = {
    positions: keptPositions,
    uvs: keptUvs,
    normals: normalsAttr ? Array.from(normalsAttr.array as Iterable<number>) : [],
    indices: null,
  };

  return {
    shell: {
      geometry: shellGeometry,
      position: raw.position,
      rotation: raw.rotation,
    },
  };
}
