import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon, getFlatRoofPolygon } from './envelope';
import { ceilingHeights, levelHeights, rightFacadeProfileCm, wallThickness } from './houseSpec';
import { RIGHT_FACADE_SEGMENTS, getSideWindowZCenter, makeMirrorZ, sideWindowSpecs } from './windowsSide';
import { frontOpeningRectsGround } from './windowsFront';
import { buildExtrudedShell } from './builders/buildExtrudedShell';
import {
  buildRightFacadeReturnPanels,
  FacadePanel,
  filterExtrudedSideFaces,
  keepOnlyOuterFacePlane,
  makeRightFacadePanels,
  type RightPanelOpening,
} from './builders/facadePanel';
const ENABLE_BRICK_RETURNS = false;
const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const RIGHT_PANEL_OUT = 0.02;
const FACADE_PANEL_THICKNESS = 0.025;
const EPSILON = 0.01;
const MIN_HOLE_W = 0.05;
const MIN_HOLE_H = 0.05;
function getFacadeXExtremesAtZ(poly: { x: number; z: number }[], zQuery: number) {
  const xs: number[] = [];

  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];

    // If the segment spans zQuery (including endpoints)
    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin - EPSILON || zQuery > zMax + EPSILON) continue;

    // If segment is horizontal in Z, take both endpoints (edge lies on the query Z)
    if (Math.abs(a.z - b.z) < EPSILON) {
      if (Math.abs(zQuery - a.z) < EPSILON) {
        xs.push(a.x, b.x);
      }
      continue;
    }

    // Linear interpolate X at zQuery along the segment
    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);
    xs.push(x);
  }

  if (!xs.length) return null;
  return { minX: Math.min(...xs), maxX: Math.max(...xs), xs };
}
const envelopeBounds = (() => {
  const outer = getEnvelopeOuterPolygon();
  return {
    minZ: Math.min(...outer.map((point) => point.z)),
    maxZ: Math.max(...outer.map((point) => point.z)),
  };
})();
const mirrorZ = makeMirrorZ(envelopeBounds.minZ, envelopeBounds.maxZ);

type ZSeg = { z0: number; z1: number; x: number };
type FacadeSegment = { x: number; z0: number; z1: number };
function computeLeftFacadeSegments(): ZSeg[] {
  const outer = getEnvelopeOuterPolygon();
  const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
  const segments: ZSeg[] = [];

  for (let i = 0; i < outer.length; i += 1) {
    const a = outer[i];
    const b = outer[(i + 1) % outer.length];

    if (Math.abs(a.x - leftX) < EPSILON && Math.abs(b.x - leftX) < EPSILON) {
      const z0 = Math.min(a.z, b.z);
      const z1 = Math.max(a.z, b.z);

      if (Math.abs(z1 - z0) > EPSILON) {
        segments.push({ z0, z1, x: leftX });
      }
    }
  }

  segments.sort((a, b) => a.z0 - b.z0);
  return segments;
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

  // --- Convert to render space (same as windows/roof logic) ---
  let z0 = mirrorZ(raw.z0);
  let z1 = mirrorZ(raw.z1);
  if (z0 > z1) [z0, z1] = [z1, z0];

  const outer = getEnvelopeOuterPolygon();
  const envMinX = outer.reduce((m, p) => Math.min(m, p.x), Infinity);
  const envMaxX = outer.reduce((m, p) => Math.max(m, p.x), -Infinity);

  // We already mirrored z0/z1 into render space above
  const zMid = (z0 + z1) / 2;

  // Find the facade X extremes *at the extension Z band*
  const slice = getFacadeXExtremesAtZ(outer, zMid);

  let x = raw.x; // fallback

  if (slice) {
    const { minX: sliceMinX, maxX: sliceMaxX } = slice;

    // Determine which side "steps in" compared to the full envelope
    const rightStepsIn = sliceMaxX < envMaxX - 0.05;
    const leftStepsIn = sliceMinX > envMinX + 0.05;

    if (rightStepsIn && !leftStepsIn) {
      // extension is on the right side (local right facade is inset)
      x = sliceMaxX;
    } else if (leftStepsIn && !rightStepsIn) {
      // extension is on the left side (local left facade is inset)
      x = sliceMinX;
    } else {
      // If both or neither step in, pick the nearer slice extreme to the flat roof footprint
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

if (EXTENSION_SIDE_WALL && EXTENSION_SIDE_WALL.z0 > EXTENSION_SIDE_WALL.z1) {
  const tmp = EXTENSION_SIDE_WALL.z0;
  EXTENSION_SIDE_WALL.z0 = EXTENSION_SIDE_WALL.z1;
  EXTENSION_SIDE_WALL.z1 = tmp;
}

const LEFT_Z_SEGMENTS = computeLeftFacadeSegments();

if (EXTENSION_SIDE_WALL) {
  LEFT_Z_SEGMENTS.push({
    z0: EXTENSION_SIDE_WALL.z0,
    z1: EXTENSION_SIDE_WALL.z1,
    x: EXTENSION_SIDE_WALL.x,
  });
}

function isExtensionSideWallFace(v: Vector3) {
  if (!EXTENSION_SIDE_WALL) return false;

  const onX = Math.abs(v.x - EXTENSION_SIDE_WALL.x) < EPSILON;
  const inZ = v.z >= EXTENSION_SIDE_WALL.z0 - EPSILON && v.z <= EXTENSION_SIDE_WALL.z1 + EPSILON;

  return onX && inZ;
}

export const wallsGround = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const innerRearZ = rearZ - exteriorThickness;
    const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
    const innerLeftX = leftX + exteriorThickness;
    const frontZ = outer.reduce((min, point) => Math.min(min, point.z), Infinity);
    const innerFrontZ = frontZ + exteriorThickness;
    const leftZSegments = LEFT_Z_SEGMENTS;

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
    const triangleCount = position.count / 3;
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

      // “Facing” helpers (tolerant)
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
      const onLeftOuter =
        facesMostlyX &&
        Math.abs(x1 - leftX) < EPSILON &&
        Math.abs(x2 - leftX) < EPSILON &&
        Math.abs(x3 - leftX) < EPSILON;
      const onLeftInner =
        facesMostlyX &&
        Math.abs(x1 - innerLeftX) < EPSILON &&
        Math.abs(x2 - innerLeftX) < EPSILON &&
        Math.abs(x3 - innerLeftX) < EPSILON;
      const triZMin = Math.min(z1, z2, z3);
      const triZMax = Math.max(z1, z2, z3);
      const onRightSegment = facesMostlyX && RIGHT_FACADE_SEGMENTS.some((segment) => {
        const outerX = segment.x;
        const innerX = segment.x - exteriorThickness;
        const onOuterX = Math.abs(x1 - outerX) < EPSILON && Math.abs(x2 - outerX) < EPSILON && Math.abs(x3 - outerX) < EPSILON;
        const onInnerX = Math.abs(x1 - innerX) < EPSILON && Math.abs(x2 - innerX) < EPSILON && Math.abs(x3 - innerX) < EPSILON;
        if (!onOuterX && !onInnerX) return false;

        const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin <= segment.z1 + EPSILON;
        return inSegmentZ;
      });
      const inAnyLeftSeg = leftZSegments.some((segment) => triZMax >= segment.z0 - EPSILON && triZMin <= segment.z1 + EPSILON);
      const onLeftFacadeSegment = (onLeftOuter || onLeftInner) && inAnyLeftSeg;

      // --- EXTENSION WALL PROTECTION (robust) ---

      const extensionSeg = EXTENSION_SIDE_WALL;

      // triangle x/z bounds
      const triXMin = Math.min(x1, x2, x3);
      const triXMax = Math.max(x1, x2, x3);

      // Z overlap with extension segment
      const inExtensionZ =
        !!extensionSeg &&
        triZMax >= extensionSeg.z0 - EPSILON &&
        triZMin <= extensionSeg.z1 + EPSILON;

      // X overlap with the *thickness band* of the left wall
      // extensionSeg.x is expected to be the OUTER left plane (e.g. -4.8)
      // innerLeftX is the INNER left plane (outer + wallThickness)
      const extensionOuterX = extensionSeg?.x ?? 0;
      const extensionInnerX = innerLeftX;

      // normalize ordering (important if coordinates ever flip)
      const bandMinX = Math.min(extensionOuterX, extensionInnerX) - EPSILON;
      const bandMaxX = Math.max(extensionOuterX, extensionInnerX) + EPSILON;

      const inExtensionXBand = !!extensionSeg && triXMax >= bandMinX && triXMin <= bandMaxX;

      // FINAL: protect any triangle whose X-range intersects the wall thickness band
      // and whose Z-range intersects the extension segment span
      const isExtensionLeftWallTriangle = false;

      // --- existing removal gate (keep everything else unchanged) ---
      const shouldRemove =
        !isExtensionLeftWallTriangle &&
        (onRearOuter || onRearInner || onFrontOuter || onFrontInner || onRightSegment || onLeftFacadeSegment);

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

    return {
      geometry: filteredGeometry,
      position: raw.position,
      rotation: raw.rotation,
    };
  })(),

  rearFacade: (() => {
    const outer = getEnvelopeOuterPolygon();
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const rearEdgePoints = outer.filter((point) => Math.abs(point.z - rearZ) < 1e-6);
    const leftX = rearEdgePoints.reduce((min, point) => Math.min(min, point.x), Infinity);
    const rightX = rearEdgePoints.reduce((max, point) => Math.max(max, point.x), -Infinity);
    const width = rightX - leftX;
    const panelCenterX = (leftX + rightX) / 2;
    const panelHeight = wallHeight;
    const panelDepth = FACADE_PANEL_THICKNESS;

    const toLocalRect = (rect: { xMin: number; xMax: number; yMin: number; yMax: number }) => ({
      xMin: rect.xMin - panelCenterX,
      xMax: rect.xMax - panelCenterX,
      yMin: rect.yMin - panelHeight / 2,
      yMax: rect.yMax - panelHeight / 2,
    });

    const shape = new Shape();
    shape.moveTo(-width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, panelHeight / 2);
    shape.lineTo(-width / 2, panelHeight / 2);
    shape.closePath();

    const openings = [
      toLocalRect({
        xMin: leftX + 1.0,
        xMax: leftX + 6.6,
        yMin: 0.0,
        yMax: 2.45,
      }),
    ];

    openings.forEach((rect) => {
      const path = new Path();
      path.moveTo(rect.xMin, rect.yMin);
      path.lineTo(rect.xMax, rect.yMin);
      path.lineTo(rect.xMax, rect.yMax);
      path.lineTo(rect.xMin, rect.yMax);
      path.closePath();
      shape.holes.push(path);
    });

    const rawPanelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    rawPanelGeometry.translate(0, 0, -panelDepth / 2);
    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsGround rearFacade', 'back', ENABLE_BRICK_RETURNS);
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsGround rearFacade');
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  frontFacade: (() => {
    const outer = getEnvelopeOuterPolygon();
    const frontZ = outer.reduce((min, point) => Math.min(min, point.z), Infinity);

    const frontEdgePoints = outer.filter((point) => Math.abs(point.z - frontZ) < 1e-6);
    const leftX = frontEdgePoints.reduce((min, point) => Math.min(min, point.x), Infinity);
    const rightX = frontEdgePoints.reduce((max, point) => Math.max(max, point.x), -Infinity);

    const width = rightX - leftX;
    const panelCenterX = (leftX + rightX) / 2;
    const panelHeight = wallHeight;
    const panelDepth = FACADE_PANEL_THICKNESS;

    const toLocalRect = (rect: { xMin: number; xMax: number; yMin: number; yMax: number }) => ({
      xMin: rect.xMin - panelCenterX,
      xMax: rect.xMax - panelCenterX,
      yMin: rect.yMin - panelHeight / 2,
      yMax: rect.yMax - panelHeight / 2,
    });

    const shape = new Shape();
    shape.moveTo(-width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, panelHeight / 2);
    shape.lineTo(-width / 2, panelHeight / 2);
    shape.closePath();

    // Holes from windowsFront.ts (ground level)
    frontOpeningRectsGround
      .map((r) => toLocalRect(r))
      .forEach((rect) => {
        const path = new Path();
        path.moveTo(rect.xMin, rect.yMin);
        path.lineTo(rect.xMax, rect.yMin);
        path.lineTo(rect.xMax, rect.yMax);
        path.lineTo(rect.xMin, rect.yMax);
        path.closePath();
        shape.holes.push(path);
      });

    const rawPanelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    rawPanelGeometry.translate(0, 0, -panelDepth / 2);

    // FRONT facade faces toward -Z, so keep the "front" facing side
    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsGround frontFacade', 'front', ENABLE_BRICK_RETURNS);
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsGround frontFacade');
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, panelHeight / 2, frontZ + panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  leftFacades: (() => makeLeftFacadePanels({ segments: LEFT_Z_SEGMENTS, mirrorZ }))(),
  rightFacades: (() => {
    const groundOpenings: RightPanelOpening[] = sideWindowSpecs.map((spec) => ({
      id: spec.id,
      zCenter: getSideWindowZCenter(spec, mirrorZ),
      widthZ: spec.width,
      y0: spec.groundY0,
      y1: spec.groundY1,
    }));

    const panels: FacadePanel[] = makeRightFacadePanels({
      mirrorZ,
      wallHeight,
      baseY: 0,
      panelOutset: RIGHT_PANEL_OUT,
      openings: groundOpenings,
      minHoleW: MIN_HOLE_W,
      minHoleH: MIN_HOLE_H,
    });
    const rightProfileM = (rightFacadeProfileCm || []).map((point) => ({
      z: point.z / 100,
      x: point.x / 100,
    }));
    const rightReturnPanels = buildRightFacadeReturnPanels({
      profile: rightProfileM,
      y0: 0,
      y1: wallHeight,
      thickness: FACADE_PANEL_THICKNESS,
    });
    panels.push(...rightReturnPanels);
    return panels;
  })(),
};

function makeSideFacadePanel({
  side,
  mirrorZ,
  level,
}: {
  side: 'left' | 'right';
  mirrorZ: (z: number) => number;
  level: 'ground' | 'first';
}): FacadePanel | null {
  const outer = getEnvelopeOuterPolygon();
  const minX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = outer.reduce((max, point) => Math.max(max, point.x), -Infinity);
  const xFace = side === 'left' ? minX : maxX;
  const edgePoints = outer.filter((point) => Math.abs(point.x - xFace) < EPSILON);
  if (edgePoints.length === 0) {
    console.warn('⚠️ sideFacade edgePoints empty', side, level);
    return null;
  }
  const minZ = edgePoints.reduce((min, point) => Math.min(min, point.z), Infinity);
  const maxZ = edgePoints.reduce((max, point) => Math.max(max, point.z), -Infinity);
  if (!Number.isFinite(minZ) || !Number.isFinite(maxZ) || maxZ <= minZ) {
    console.warn('⚠️ sideFacade invalid z range', { side, level, minZ, maxZ });
    return null;
  }
  const panelWidth = maxZ - minZ;
  const panelCenterZ = (minZ + maxZ) / 2;
  const panelHeight = wallHeight;
  const panelDepth = FACADE_PANEL_THICKNESS;
  const panelCenterX = side === 'left' ? xFace + panelDepth / 2 : xFace - panelDepth / 2;

  const shape = new Shape();
  shape.moveTo(-panelWidth / 2, -panelHeight / 2);
  shape.lineTo(panelWidth / 2, -panelHeight / 2);
  shape.lineTo(panelWidth / 2, panelHeight / 2);
  shape.lineTo(-panelWidth / 2, panelHeight / 2);
  shape.closePath();

  const openings =
    level === 'ground'
      ? sideWindowSpecs
      : sideWindowSpecs.filter((spec) => spec.firstY1 - spec.firstY0 > MIN_HOLE_H);
  const panelBaseY = level === 'ground' ? 0 : levelHeights.firstFloor;

  openings.forEach((spec) => {
    const zCenter = getSideWindowZCenter(spec, mirrorZ);
    const zMin = zCenter - spec.width / 2;
    const zMax = zCenter + spec.width / 2;
    const yMin = level === 'ground' ? spec.groundY0 : spec.firstY0;
    const yMax = level === 'ground' ? spec.groundY1 : spec.firstY1;

    if (zMax - zMin < MIN_HOLE_W || yMax - yMin < MIN_HOLE_H || zMax <= zMin || yMax <= yMin) return;

    const path = new Path();
    path.moveTo(zMin - panelCenterZ, yMin - (panelBaseY + panelHeight / 2));
    path.lineTo(zMax - panelCenterZ, yMin - (panelBaseY + panelHeight / 2));
    path.lineTo(zMax - panelCenterZ, yMax - (panelBaseY + panelHeight / 2));
    path.lineTo(zMin - panelCenterZ, yMax - (panelBaseY + panelHeight / 2));
    path.closePath();
    shape.holes.push(path);
  });

  const rawPanelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
  rawPanelGeometry.translate(0, 0, -panelDepth / 2);
  const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, `wallsGround sideFacade ${side} ${level}`, 'front', ENABLE_BRICK_RETURNS);
  const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, `wallsGround sideFacade ${side} ${level}`);
  const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  panelGeometry.rotateY(rotationY);
  panelGeometry.computeVertexNormals();

  return {
    geometry: panelGeometry,
    position: [panelCenterX, panelHeight / 2, panelCenterZ] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  };
}

function makeLeftFacadePanels({
  segments,
  mirrorZ,
}: {
  segments: ZSeg[];
  mirrorZ: (z: number) => number;
}) {
  const outer = getEnvelopeOuterPolygon();
  const panelDepth = FACADE_PANEL_THICKNESS;

  return segments
    .map((segment, index) => {
      // ✅ DO NOT SKIP extension segment

      const widthZ = segment.z1 - segment.z0;
      const panelCenterZ = (segment.z0 + segment.z1) / 2;
      const panelBaseY = 0;

      const openings: Opening[] = [];
      sideWindowSpecs.forEach((spec) => {
        const zCenter = getSideWindowZCenter(spec, mirrorZ);
        if (zCenter < segment.z0 - EPSILON || zCenter > segment.z1 + EPSILON) return;

        openings.push({
          id: spec.id,
          zCenter,
          widthZ: spec.width,
          y0: spec.groundY0,
          y1: spec.groundY1,
        });
      });

      const shape = new Shape();
      shape.moveTo(-widthZ / 2, -wallHeight / 2);
      shape.lineTo(widthZ / 2, -wallHeight / 2);
      shape.lineTo(widthZ / 2, wallHeight / 2);
      shape.lineTo(-widthZ / 2, wallHeight / 2);
      shape.closePath();

      openings.forEach((opening) => {
        const zMin = opening.zCenter - opening.widthZ / 2;
        const zMax = opening.zCenter + opening.widthZ / 2;
        const yMin = opening.y0;
        const yMax = opening.y1;

        if (zMax - zMin < MIN_HOLE_W || yMax - yMin < MIN_HOLE_H || zMax <= zMin || yMax <= yMin) return;

        const path = new Path();
        path.moveTo(zMin - panelCenterZ, yMin - (panelBaseY + wallHeight / 2));
        path.lineTo(zMax - panelCenterZ, yMin - (panelBaseY + wallHeight / 2));
        path.lineTo(zMax - panelCenterZ, yMax - (panelBaseY + wallHeight / 2));
        path.lineTo(zMin - panelCenterZ, yMax - (panelBaseY + wallHeight / 2));
        path.closePath();
        shape.holes.push(path);
      });

      const panelGeometry = new ShapeGeometry(shape);

      // Decide whether this segment is on the left or right side of the envelope
      const envMinX = outer.reduce((m, p) => Math.min(m, p.x), Infinity);
      const envMaxX = outer.reduce((m, p) => Math.max(m, p.x), -Infinity);

      // segment.x is the OUTER facade plane for that segment (you pushed it in when you added the extension segment)
      const dToLeft = Math.abs(segment.x - envMinX);
      const dToRight = Math.abs(segment.x - envMaxX);
      const isLeftSide = dToLeft < dToRight;

      // Small offset to avoid z-fighting with shell
      const OUTSET = 0.002;

      if (isLeftSide) {
        // Left facade faces outward toward -X
        panelGeometry.rotateY(Math.PI / 2);
      } else {
        // Right facade faces outward toward +X
        panelGeometry.rotateY(-Math.PI / 2);
      }

      panelGeometry.computeVertexNormals();

      const xPos = isLeftSide
        ? segment.x - panelDepth / 2 - OUTSET
        : segment.x + panelDepth / 2 + OUTSET;

      return {
        geometry: panelGeometry,
        position: [xPos, wallHeight / 2, panelCenterZ] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
      };
    })
    .filter((panel): panel is NonNullable<typeof panel> => !!panel);
}

