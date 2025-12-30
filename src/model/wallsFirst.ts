import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Mesh, Path, Shape, ShapeGeometry, Vector3 } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import {
  LEFT_FACADE_SEGMENTS,
  ceilingHeights,
  leftFacadeProfileCm,
  levelHeights,
  wallThickness,
} from './houseSpec';
import { getSideWindowZCenter, makeMirrorZ, sideMirrorZ, sideWindowSpecs, sideZMax, sideZMin, windowsSide } from './windowsSide';
import { frontOpeningRectsFirst } from './windowsFront';

console.log('WALLS_FIRST LOADED', new Date().toISOString());

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

type SegmentId = (typeof LEFT_FACADE_SEGMENTS)[number]['id'];
type Opening = { id: string; zCenter: number; widthZ: number; y0: number; y1: number };

const facadeSegments = LEFT_FACADE_SEGMENTS;

const sideFacadeProfileCm = leftFacadeProfileCm;

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

    const toShapePoints = (points: { x: number; z: number }[]) => {
      const openPoints =
        points.length > 1 && points[0].x === points[points.length - 1].x && points[0].z === points[points.length - 1].z
          ? points.slice(0, -1)
          : points;

      return openPoints;
    };

    const outerShape = new Shape();
    const outerPoints = toShapePoints(outer);
    outerPoints.forEach((point, index) => {
      if (index === 0) {
        outerShape.moveTo(point.x, -point.z);
      } else {
        outerShape.lineTo(point.x, -point.z);
      }
    });
    outerShape.closePath();

    const holePath = new Path();
    const innerPoints = toShapePoints(inner);
    innerPoints.forEach((point, index) => {
      if (index === 0) {
        holePath.moveTo(point.x, -point.z);
      } else {
        holePath.lineTo(point.x, -point.z);
      }
    });
    holePath.closePath();
    outerShape.holes.push(holePath);

    const geometry = new ExtrudeGeometry(outerShape, { depth: wallHeight, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);

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
        facadeSegments.some((segment) => {
          const outerX = segment.x;
          const sign = Math.sign(segment.x) || 1;
          const innerX = segment.x - exteriorThickness * sign;
          const onOuterX =
            Math.abs(x1 - outerX) < EPSILON && Math.abs(x2 - outerX) < EPSILON && Math.abs(x3 - outerX) < EPSILON;
          const onInnerX =
            Math.abs(x1 - innerX) < EPSILON && Math.abs(x2 - innerX) < EPSILON && Math.abs(x3 - innerX) < EPSILON;
          if (!onOuterX && !onInnerX) return false;

          const inSegmentZ = triZMax >= segment.z0 - EPSILON && triZMin <= segment.z1 + EPSILON;
          return inSegmentZ;
        });

      if (onRearOuter || onRearInner || onFrontOuter || onFrontInner || onLeftOuter || onLeftInner || onRightSegment) {
        if (onRearOuter) {
          removedOuter += 1;
        }
        if (onFrontOuter) {
          removedFront += 1;
        }
        if (onRearInner || onFrontInner) {
          removedInner += 1;
        }
        if (onLeftOuter || onLeftInner || onRightSegment) {
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
    console.log(
      '✅ wallsFirst rear/side faces removed for facade panels',
      { removedOuter, removedFront, removedInner, removedSide, removedTotal, keptTotal },
      Date.now(),
    );

    return {
      geometry: filteredGeometry,
      position: [0, firstFloorLevel, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
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
    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsFirst rearFacade', 'back');
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsFirst rearFacade');
    panelGeometry.computeVertexNormals();
    console.log('✅ FACADE PANEL THICKNESS', panelDepth);

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

    const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, 'wallsFirst frontFacade', 'front');
    const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, 'wallsFirst frontFacade');
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, firstFloorLevel + panelHeight / 2, frontZ + panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  leftFacade: (() => makeSideFacadePanel({ side: 'left', level: 'first' }))(),
  rightFacade: (() => makeSideFacadePanel({ side: 'right', level: 'first' }))(),
  leftFacades: (() => {
    const panels = makeSideFacadePanels(mirrorZ, facadeSegments);
    const sideProfileM = (sideFacadeProfileCm || []).map((point) => ({
      z: point.z / 100,
      x: point.x / 100,
    }));
    const rightReturnPanels = buildRightFacadeReturnPanels({
      profile: sideProfileM,
      y0: firstFloorLevel,
      y1: firstFloorLevel + wallHeight,
      thickness: FACADE_PANEL_THICKNESS,
    });
    panels.push(...rightReturnPanels);
    return panels;
  })(),
  rightFacades: (() => {
    const panel = makeSideFacadePanel({ side: 'right', level: 'first' });
    if (!panel) return [];
    return [panel];
  })(),
};

function makeSideFacadePanel({
  side,
  level,
}: {
  side: 'left' | 'right';
  level: 'ground' | 'first';
}) {
  const outer = getEnvelopeFirstOuterPolygon();
  const minX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = outer.reduce((max, point) => Math.max(max, point.x), -Infinity);
  const xFace = side === 'left' ? minX : maxX;
  const minZ = outer.reduce((min, point) => Math.min(min, point.z), Infinity);
  const maxZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
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
    side === 'right'
      ? []
      : level === 'ground'
        ? sideWindowSpecs
        : sideWindowSpecs.filter((spec) => spec.firstY1 - spec.firstY0 > MIN_HOLE_H);
  const panelBaseY = level === 'ground' ? 0 : firstFloorLevel;

  openings.forEach((spec) => {
    const zMirror = (z: number) => {
      const isActiveSide = side === windowsSide.side;
      if (isActiveSide) return sideMirrorZ(z, windowsSide.zMin, windowsSide.zMax, windowsSide.mirrorZ);
      return sideMirrorZ(z, minZ, maxZ, windowsSide.mirrorZ);
    };

    const zCenter = getSideWindowZCenter(spec, zMirror);
    const zMin = zCenter - spec.width / 2;
    const zMax = zCenter + spec.width / 2;
    const isTall = spec.kind === 'tall' || spec.type === 'tall';

    // Only ground-level “tall” openings should be allowed to run full height (if that’s your intent).
    // On first floor, ALWAYS use firstY0/firstY1 so brick remains above.
    const isFullHeightTall = level === 'ground' && isTall;

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

    console.log('✅ wallsFirst side opening', level, side, spec.id, {
      zCenter: zMirror(spec.zCenter),
      panelCenterZ,
    });

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
  const panelGeometryA = filterExtrudedSideFaces(rawPanelGeometry, panelDepth, `wallsFirst sideFacade ${side} ${level}`, 'front');
  const panelGeometry = keepOnlyOuterFacePlane(panelGeometryA, `wallsFirst sideFacade ${side} ${level}`);
  const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  panelGeometry.rotateY(rotationY);
  panelGeometry.computeVertexNormals();
  console.log('✅ FACADE PANEL THICKNESS', panelDepth);

  return {
    geometry: panelGeometry,
    position: [panelCenterX, firstFloorLevel + panelHeight / 2, panelCenterZ] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  };
}

function makeSideFacadePanels(mirrorZ: (z: number) => number, segments = facadeSegments) {
  const openingsBySegmentId = segments.reduce<Record<SegmentId, Opening[]>>((acc, segment) => {
    acc[segment.id] = [];
    return acc;
  }, {} as Record<SegmentId, Opening[]>);
  const windowsForLevel = sideWindowSpecs.filter((spec) => spec.firstY1 - spec.firstY0 > MIN_HOLE_H);

  windowsForLevel.forEach((spec) => {
    const zCenter = getSideWindowZCenter(spec, mirrorZ);
    const segment = segmentForZ(zCenter, segments);
    const widthZ = spec.width;
    const isTall = spec.kind === 'tall' || spec.type === 'tall';
    const y0 = isTall ? 0 : spec.firstY0 - firstFloorLevel;
    const y1 = isTall ? wallHeight : spec.firstY1 - firstFloorLevel;

    openingsBySegmentId[segment.id].push({ id: spec.id, zCenter, widthZ, y0, y1 });
  });

  return segments.map((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const holes: Opening[] = openingsBySegmentId[segment.id];

    const shape = new Shape();
    shape.moveTo(-widthZ / 2, -wallHeight / 2);
    shape.lineTo(widthZ / 2, -wallHeight / 2);
    shape.lineTo(widthZ / 2, wallHeight / 2);
    shape.lineTo(-widthZ / 2, wallHeight / 2);
    shape.closePath();

    holes.forEach((opening) => {
      const zMin = opening.zCenter - opening.widthZ / 2;
      const zMax = opening.zCenter + opening.widthZ / 2;
      const yMin = opening.y0;
      const yMax = opening.y1;

      if (zMax - zMin < MIN_HOLE_W || yMax - yMin < MIN_HOLE_H || zMax <= zMin || yMax <= yMin) return;

      const path = new Path();
      path.moveTo(zMin - panelCenterZ, yMin - wallHeight / 2);
      path.lineTo(zMax - panelCenterZ, yMin - wallHeight / 2);
      path.lineTo(zMax - panelCenterZ, yMax - wallHeight / 2);
      path.lineTo(zMin - panelCenterZ, yMax - wallHeight / 2);
      path.closePath();
      shape.holes.push(path);
    });

    const sideDir = Math.sign(segment.x) || 1;
    const rotationY = sideDir > 0 ? -Math.PI / 2 : Math.PI / 2;
    const panelGeometry = new ShapeGeometry(shape);
    panelGeometry.rotateY(rotationY);
    panelGeometry.computeVertexNormals();

    console.log('✅ RIGHT PANEL', segment.id, {
      holeCount: holes.length,
      z0: segment.z0,
      z1: segment.z1,
      x: segment.x,
      sideDir,
    });

    return {
      geometry: panelGeometry,
      position: [segment.x + sideDir * RIGHT_PANEL_OUT, firstFloorLevel + wallHeight / 2, panelCenterZ] as [
        number,
        number,
        number,
      ],
      rotation: [0, 0, 0] as [number, number, number],
    };
  });
}

function buildRightFacadeReturnPanels(params: {
  profile: { z: number; x: number }[];
  y0: number;
  y1: number;
  thickness: number;
  zOffset?: number;
}) {
  const { profile, y0, y1, thickness, zOffset = 0.002 } = params;

  const panels: Mesh[] = [];
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
    const mesh = new Mesh(solidGeom);
    mesh.position.set((xMin + xMax) / 2, (y0 + y1) / 2, zStep - zOffset);

    panels.push(mesh);
  }

  return panels;
}

function segmentForZ(zCenter: number, segments = facadeSegments) {
  for (const segment of segments) {
    if (zCenter < segment.z1) return segment;
  }
  return segments[segments.length - 1];
}

function keepOnlyOuterFacePlane(geometry: BufferGeometry, context: string) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = source.getAttribute('position');
  const uv = source.getAttribute('uv');

  // Determine which depth-plane is “outer” by centroid projection clustering.
  // After filterExtrudedSideFaces(), triangles should lie on exactly TWO parallel planes.
  // We keep the plane with the larger average Z in local extrude space.
  // (This works regardless of winding/material side and removes the inner plane entirely.)

  const triCount = pos.count / 3;

  let maxProj = -Infinity;
  let minProj = Infinity;
  const triProj: number[] = new Array(triCount);

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    // Use local Z as “depth axis” because extrusion depth is along local Z
    const z0 = pos.getZ(i0),
      z1 = pos.getZ(i1),
      z2 = pos.getZ(i2);
    const proj = (z0 + z1 + z2) / 3;

    triProj[t] = proj;
    if (proj > maxProj) maxProj = proj;
    if (proj < minProj) minProj = proj;
  }

  const EPS = 1e-3;
  // Keep the plane that’s at maxProj (outer). Remove the plane at minProj (inner).
  const keptPos: number[] = [];
  const keptUv: number[] = [];

  let removed = 0;
  let kept = 0;

  for (let t = 0; t < triCount; t++) {
    const proj = triProj[t];

    // Keep only triangles close to the outer plane
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

function filterExtrudedSideFaces(
  geometry: BufferGeometry,
  depth: number,
  context: string,
  keepPlane: 'front' | 'back' | 'both' = 'both',
) {
  if (ENABLE_BRICK_RETURNS) return geometry;

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

    const onFront = Math.abs(z1 + halfDepth) < EPSILON && Math.abs(z2 + halfDepth) < EPSILON && Math.abs(z3 + halfDepth) < EPSILON;
    const onBack = Math.abs(z1 - halfDepth) < EPSILON && Math.abs(z2 - halfDepth) < EPSILON && Math.abs(z3 - halfDepth) < EPSILON;

    const keepThisTriangle =
      keepPlane === 'both' ? onFront || onBack : keepPlane === 'front' ? onFront : onBack;

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
