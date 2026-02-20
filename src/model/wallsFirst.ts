import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry, Vector3 } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { ceilingHeights, levelHeights, rightFacadeProfileCm, wallThickness } from './houseSpec';
import {
  getSideWindowZCenter,
  ARCH_LEFT_FACADE_SEGMENTS,
  makeMirrorZ,
  ARCH_RIGHT_FACADE_SEGMENTS,
  rightSideWindowSpecs,
  sideMirrorZ,
  sideWindowSpecs,
  sideZMax,
  sideZMin,
  windowsSideConfig,
} from './builders/windowFactory';
import { frontOpeningRectsFirst } from './windowsFront';
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
const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;
const RIGHT_PANEL_OUT = 0.02;
const firstFloorLevel = levelHeights.firstFloor;
const FACADE_PANEL_THICKNESS = 0.025;
const EPSILON = 0.01;
const MIN_HOLE_W = 0.05;
const MIN_HOLE_H = 0.05;
const mirrorZ = makeMirrorZ(sideZMin, sideZMax);

export const wallsFirst = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const innerRearZ = rearZ - exteriorThickness;
    const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
    const innerLeftX = leftX + exteriorThickness;
    const frontZ = outer.reduce((min, point) => Math.min(min, point.z), Infinity);
    const innerFrontZ = frontZ + exteriorThickness;

    const raw = buildExtrudedShell({
      outerPoints: outer,
      innerPoints: inner,
      height: wallHeight,
      baseY: firstFloorLevel,
    });
    const geometry = raw.geometry;

    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const position = g.getAttribute('position');
    const uv = g.getAttribute('uv');

    const keptPositions: number[] = [];
    const keptUvs: number[] = [];
    const triangleCount = position.count / 3;
    let removedOuter = 0;
    let removedFront = 0;
    let removedInner = 0;
    let removedSide = 0;
    let keptTotal = 0;

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
      const onRearInner =
        facesMostlyZ &&
        Math.abs(z1 - innerRearZ) < EPSILON &&
        Math.abs(z2 - innerRearZ) < EPSILON &&
        Math.abs(z3 - innerRearZ) < EPSILON;
      const onFrontOuter =
        facesMostlyZ &&
        Math.abs(z1 - frontZ) < EPSILON &&
        Math.abs(z2 - frontZ) < EPSILON &&
        Math.abs(z3 - frontZ) < EPSILON;
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
      const onRightSegment =
        facesMostlyX &&
        ARCH_LEFT_FACADE_SEGMENTS.some((segment) => {
          const outerX = segment.x;
          const innerX = segment.x - exteriorThickness;
          const onOuterX =
            Math.abs(x1 - outerX) < EPSILON && Math.abs(x2 - outerX) < EPSILON && Math.abs(x3 - outerX) < EPSILON;
          const onInnerX =
            Math.abs(x1 - innerX) < EPSILON && Math.abs(x2 - innerX) < EPSILON && Math.abs(x3 - innerX) < EPSILON;
          if (!onOuterX && !onInnerX) return false;

          const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin + EPSILON < segment.z1;
          return inSegmentZ;
        });

      const onLeftSegment =
        facesMostlyX &&
        ARCH_RIGHT_FACADE_SEGMENTS.some((segment) => {
          const outerX = segment.x;
          const innerX = segment.x + exteriorThickness; // inward = positive for negative-x facade
          const onOuterX =
            Math.abs(x1 - outerX) < EPSILON && Math.abs(x2 - outerX) < EPSILON && Math.abs(x3 - outerX) < EPSILON;
          const onInnerX =
            Math.abs(x1 - innerX) < EPSILON && Math.abs(x2 - innerX) < EPSILON && Math.abs(x3 - innerX) < EPSILON;
          if (!onOuterX && !onInnerX) return false;

          const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin + EPSILON < segment.z1;
          return inSegmentZ;
        });

      if (onRearOuter || onRearInner || onFrontOuter || onFrontInner || onLeftOuter || onLeftInner || onRightSegment || onLeftSegment) {
        if (onRearOuter) {
          removedOuter += 1;
        }
        if (onFrontOuter) {
          removedFront += 1;
        }
        if (onRearInner || onFrontInner) {
          removedInner += 1;
        }
        if (onLeftOuter || onLeftInner || onRightSegment || onLeftSegment) {
          removedSide += 1;
        }
        continue;
      }

      indices.forEach((index) => {
        keptPositions.push(position.getX(index), position.getY(index), position.getZ(index));
        if (uv) {
          keptUvs.push(uv.getX(index), uv.getY(index));
        }
      });

      keptTotal += 1;
    }

    const filteredGeometry = new BufferGeometry();
    filteredGeometry.setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
    if (uv && keptUvs.length > 0) {
      filteredGeometry.setAttribute('uv', new Float32BufferAttribute(keptUvs, 2));
    }
    filteredGeometry.computeVertexNormals();

    const removedTotal = removedOuter + removedFront + removedInner + removedSide;
    return {
      geometry: filteredGeometry,
      position: raw.position,
      rotation: raw.rotation,
    };
  })(),

  rearFacade: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
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

    const yMinLocal = 0.8;
    const yMaxLocal = 2.4;
    const firstWindowStart = leftX + 1.7;
    const openings = [
      toLocalRect({
        xMin: firstWindowStart,
        xMax: firstWindowStart + 1.1,
        yMin: yMinLocal,
        yMax: yMaxLocal,
      }),
      toLocalRect({
        xMin: firstWindowStart + 1.1 + 2.0,
        xMax: firstWindowStart + 1.1 + 2.0 + 1.1,
        yMin: yMinLocal,
        yMax: yMaxLocal,
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
    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsFirst rearFacade', 'back', ENABLE_BRICK_RETURNS);
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsFirst rearFacade');
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, firstFloorLevel + panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  frontFacade: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
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

    // Holes are LOCAL to the first-floor wall base
    frontOpeningRectsFirst
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

    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsFirst frontFacade', 'front', ENABLE_BRICK_RETURNS);
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsFirst frontFacade');
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, firstFloorLevel + panelHeight / 2, frontZ + panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  leftFacade: (() => makeSideFacadePanel({ side: 'left', level: 'first' }))(),
  rightSideFacades: (() => makeRightSideFirstFloorPanels())(),
  rightFacade: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const rightX = outer.reduce((max, p) => Math.max(max, p.x), -Infinity);
    const edgePoints = outer.filter((p) => Math.abs(p.x - rightX) < EPSILON);
    const minZ = edgePoints.reduce((m, p) => Math.min(m, p.z), Infinity);
    const maxZ = edgePoints.reduce((m, p) => Math.max(m, p.z), -Infinity);

    const panelWidth = maxZ - minZ;
    const panelCenterZ = (minZ + maxZ) / 2;
    const panelHeight = wallHeight;
    const panelDepth = FACADE_PANEL_THICKNESS;

    const shape = new Shape();
    shape.moveTo(-panelWidth / 2, -panelHeight / 2);
    shape.lineTo(panelWidth / 2, -panelHeight / 2);
    shape.lineTo(panelWidth / 2, panelHeight / 2);
    shape.lineTo(-panelWidth / 2, panelHeight / 2);
    shape.closePath();

    // IMPORTANT: mirrorZ must match windowsSide, not the first-floor minZ/maxZ
    const mirrorZ = makeMirrorZ(sideZMin, sideZMax);

    // Create holes from sideWindowSpecs
    sideWindowSpecs.forEach((spec) => {
      const zCenter = getSideWindowZCenter(spec, mirrorZ);

      const zMinHole = zCenter - spec.width / 2;
      const zMaxHole = zCenter + spec.width / 2;

      // Convert world Y to first-floor local panel Y:
      // panel local Y is 0..wallHeight, but shape space is centered => subtract panelHeight/2.
      const yMinWorld = spec.firstY0; // e.g. levelHeights.firstFloor
      const yMaxWorld = spec.firstY1; // e.g. levelHeights.firstFloor + ceilingHeights.first

      // Convert to local within this first-floor panel:
      const yMinLocal = yMinWorld - firstFloorLevel - panelHeight / 2;
      const yMaxLocal = yMaxWorld - firstFloorLevel - panelHeight / 2;

      // guard
      if (zMaxHole - zMinHole < 0.05 || yMaxLocal - yMinLocal < 0.05) return;

      const path = new Path();
      path.moveTo(zMinHole - panelCenterZ, yMinLocal);
      path.lineTo(zMaxHole - panelCenterZ, yMinLocal);
      path.lineTo(zMaxHole - panelCenterZ, yMaxLocal);
      path.lineTo(zMinHole - panelCenterZ, yMaxLocal);
      path.closePath();
      shape.holes.push(path);
    });

    const rawPanelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    rawPanelGeometry.translate(0, 0, -panelDepth / 2);
    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsFirst rightFacade', 'front', ENABLE_BRICK_RETURNS);
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsFirst rightFacade');

    return {
      geometry: panelGeometry,
      position: [rightX - panelDepth / 2, firstFloorLevel + panelHeight / 2, panelCenterZ] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
    };
  })(),
  rightFacades: (() => {
    const firstOpenings: RightPanelOpening[] = sideWindowSpecs
      .filter((spec) => spec.firstY1 - spec.firstY0 > MIN_HOLE_H)
      .map((spec) => {
        const isTall = spec.kind === 'tall' || spec.type === 'tall';
        return {
          id: spec.id,
          zCenter: getSideWindowZCenter(spec, mirrorZ),
          widthZ: spec.width,
          y0: isTall ? firstFloorLevel : spec.firstY0,
          y1: isTall ? firstFloorLevel + wallHeight : spec.firstY1,
        };
      });

    const panels: FacadePanel[] = makeRightFacadePanels({
      mirrorZ,
      wallHeight,
      baseY: firstFloorLevel,
      panelOutset: RIGHT_PANEL_OUT,
      openings: firstOpenings,
      minHoleW: MIN_HOLE_W,
      minHoleH: MIN_HOLE_H,
    });
    const rightProfileM = (rightFacadeProfileCm || []).map((point) => ({
      z: point.z / 100,
      x: point.x / 100,
    }));
    const rightReturnPanels = buildRightFacadeReturnPanels({
      profile: rightProfileM,
      y0: firstFloorLevel,
      y1: firstFloorLevel + wallHeight,
      thickness: FACADE_PANEL_THICKNESS,
    });
    panels.push(...rightReturnPanels);
    return panels;
  })(),
};

function makeSideFacadePanel({
  side,
  level,
}: {
  side: 'left' | 'right';
  level: 'ground' | 'first';
}): FacadePanel | null {
  const outer = getEnvelopeFirstOuterPolygon();
  const minX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = outer.reduce((max, point) => Math.max(max, point.x), -Infinity);
  const xFace = side === 'left' ? minX : maxX;
  const edgePoints = outer.filter((point) => Math.abs(point.x - xFace) < EPSILON);
  const minZ = edgePoints.reduce((min, point) => Math.min(min, point.z), Infinity);
  const maxZ = edgePoints.reduce((max, point) => Math.max(max, point.z), -Infinity);
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
  const panelBaseY = level === 'ground' ? 0 : firstFloorLevel;

  openings.forEach((spec) => {
    const zMirror = (z: number) => {
      const sideArch = side === 'left' ? 'RIGHT' : 'LEFT';
      const isActiveSide = sideArch === windowsSideConfig.side;
      if (isActiveSide) return sideMirrorZ(z, windowsSideConfig.zMin, windowsSideConfig.zMax, windowsSideConfig.mirrorZ);
      return sideMirrorZ(z, minZ, maxZ, windowsSideConfig.mirrorZ);
    };

    const zCenter = getSideWindowZCenter(spec, zMirror);
    const zMin = zCenter - spec.width / 2;
    const zMax = zCenter + spec.width / 2;
    const isTall = spec.kind === 'tall' || spec.type === 'tall';

    // Only ground-level “tall” openings should be allowed to run full height (if that’s your intent).
    // On first floor, ALWAYS use firstY0/firstY1 so brick remains above.
    const isFullHeightTall = isTall;

    const yMinLocal =
      level === 'ground'
        ? spec.groundY0
        : isFullHeightTall
          ? 0
          : spec.firstY0 - panelBaseY;

    const yMaxLocal =
      level === 'ground'
        ? spec.groundY1
        : isFullHeightTall
          ? panelHeight
          : spec.firstY1 - panelBaseY;

    if (
      zMax - zMin < MIN_HOLE_W ||
      yMaxLocal - yMinLocal < MIN_HOLE_H ||
      zMax <= zMin ||
      yMaxLocal <= yMinLocal
    )
      return;

    const path = new Path();
    path.moveTo(zMin - panelCenterZ, yMinLocal - panelHeight / 2);
    path.lineTo(zMax - panelCenterZ, yMinLocal - panelHeight / 2);
    path.lineTo(zMax - panelCenterZ, yMaxLocal - panelHeight / 2);
    path.lineTo(zMin - panelCenterZ, yMaxLocal - panelHeight / 2);
    path.closePath();
    shape.holes.push(path);
  });

  const rawPanelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
  rawPanelGeometry.translate(0, 0, -panelDepth / 2);
  const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, `wallsFirst sideFacade ${side} ${level}`, 'front', ENABLE_BRICK_RETURNS);
  const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, `wallsFirst sideFacade ${side} ${level}`);
  const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  panelGeometry.rotateY(rotationY);
  panelGeometry.computeVertexNormals();

  return {
    geometry: panelGeometry,
    position: [panelCenterX, firstFloorLevel + panelHeight / 2, panelCenterZ] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  };
}

// First-floor panels for the architectural RIGHT facade (negative X world space)
function makeRightSideFirstFloorPanels(): FacadePanel[] {
  const panelDepth = FACADE_PANEL_THICKNESS;
  const OUTSET = 0.002;

  return ARCH_RIGHT_FACADE_SEGMENTS.map((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const panelBaseY = firstFloorLevel;

    const shape = new Shape();
    shape.moveTo(-widthZ / 2, -wallHeight / 2);
    shape.lineTo(widthZ / 2, -wallHeight / 2);
    shape.lineTo(widthZ / 2, wallHeight / 2);
    shape.lineTo(-widthZ / 2, wallHeight / 2);
    shape.closePath();

    // Punch holes for right-side first-floor windows
    rightSideWindowSpecs.forEach((spec) => {
      const zCenter = spec.zCenter;
      if (zCenter < segment.z0 - EPSILON || zCenter > segment.z1 + EPSILON) return;
      if (spec.firstY1 - spec.firstY0 < MIN_HOLE_H) return;

      const zMin = zCenter - spec.width / 2;
      const zMax = zCenter + spec.width / 2;
      // y values from spec are absolute world Y; convert to panel-local space
      const yMin = spec.firstY0 - panelBaseY;
      const yMax = spec.firstY1 - panelBaseY;

      if (yMax - yMin < MIN_HOLE_H) return;

      const path = new Path();
      path.moveTo(zMin - panelCenterZ, yMin - wallHeight / 2);
      path.lineTo(zMax - panelCenterZ, yMin - wallHeight / 2);
      path.lineTo(zMax - panelCenterZ, yMax - wallHeight / 2);
      path.lineTo(zMin - panelCenterZ, yMax - wallHeight / 2);
      path.closePath();
      shape.holes.push(path);
    });

    const panelGeometry = new ShapeGeometry(shape);
    // Faces outward toward -X
    panelGeometry.rotateY(Math.PI / 2);
    panelGeometry.computeVertexNormals();

    const xPos = segment.x - panelDepth / 2 - OUTSET;

    return {
      geometry: panelGeometry,
      position: [xPos, firstFloorLevel + wallHeight / 2, panelCenterZ] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  });
}
