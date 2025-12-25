import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import { RIGHT_FACADE_SEGMENTS, makeMirrorZ, sideWindowSpecs, sideWindowZ } from './windowsSide';

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const EPSILON = 0.01;
const MIN_HOLE_W = 0.05;
const MIN_HOLE_H = 0.05;
const mirrorZ = makeMirrorZ();

type SegmentId = (typeof RIGHT_FACADE_SEGMENTS)[number]['id'];
type Opening = { id: string; zCenter: number; widthZ: number; y0: number; y1: number };

export const wallsGround = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const innerRearZ = rearZ - exteriorThickness;
    const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
    const innerLeftX = leftX + exteriorThickness;

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

      const onRearOuter = Math.abs(z1 - rearZ) < EPSILON && Math.abs(z2 - rearZ) < EPSILON && Math.abs(z3 - rearZ) < EPSILON;
      const onRearInner =
        Math.abs(z1 - innerRearZ) < EPSILON && Math.abs(z2 - innerRearZ) < EPSILON && Math.abs(z3 - innerRearZ) < EPSILON;
      const onLeftOuter = Math.abs(x1 - leftX) < EPSILON && Math.abs(x2 - leftX) < EPSILON && Math.abs(x3 - leftX) < EPSILON;
      const onLeftInner =
        Math.abs(x1 - innerLeftX) < EPSILON && Math.abs(x2 - innerLeftX) < EPSILON && Math.abs(x3 - innerLeftX) < EPSILON;
      const onRightSegment = RIGHT_FACADE_SEGMENTS.some((segment) => {
        const outerX = segment.x;
        const innerX = segment.x - exteriorThickness;
        const onOuterX = Math.abs(x1 - outerX) < EPSILON && Math.abs(x2 - outerX) < EPSILON && Math.abs(x3 - outerX) < EPSILON;
        const onInnerX = Math.abs(x1 - innerX) < EPSILON && Math.abs(x2 - innerX) < EPSILON && Math.abs(x3 - innerX) < EPSILON;
        if (!onOuterX && !onInnerX) return false;

        const zMinTri = Math.min(z1, z2, z3);
        const zMaxTri = Math.max(z1, z2, z3);
        const inSegmentZ = zMaxTri >= segment.z0 - EPSILON && zMinTri <= segment.z1 + EPSILON;
        return inSegmentZ;
      });

      if (onRearOuter || onRearInner || onLeftOuter || onLeftInner || onRightSegment) {
        if (onRearOuter) {
          removedOuter += 1;
        }
        if (onRearInner) {
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

    const removedTotal = removedOuter + removedInner + removedSide;
    console.log(
      '✅ wallsGround rear/side faces removed for facade panels',
      { removedOuter, removedInner, removedSide, removedTotal, keptTotal },
      Date.now(),
    );

    return {
      geometry: filteredGeometry,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
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
    const panelDepth = exteriorThickness;

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

    const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    panelGeometry.translate(0, 0, -panelDepth / 2);
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  leftFacade: (() => makeSideFacadePanel({ side: 'left', level: 'ground', mirrorZ }))(),
  rightFacades: (() => makeRightFacadePanels(mirrorZ))(),
};

function makeSideFacadePanel({
  side,
  mirrorZ,
  level,
}: {
  side: 'left' | 'right';
  mirrorZ: (z: number) => number;
  level: 'ground' | 'first';
}) {
  const outer = getEnvelopeOuterPolygon();
  const minX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = outer.reduce((max, point) => Math.max(max, point.x), -Infinity);
  const xFace = side === 'left' ? minX : maxX;
  const edgePoints = outer.filter((point) => Math.abs(point.x - xFace) < EPSILON);
  const minZ = edgePoints.reduce((min, point) => Math.min(min, point.z), Infinity);
  const maxZ = edgePoints.reduce((max, point) => Math.max(max, point.z), -Infinity);
  const panelWidth = maxZ - minZ;
  const panelCenterZ = (minZ + maxZ) / 2;
  const panelHeight = wallHeight;
  const panelDepth = exteriorThickness;
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
    const zCenter = sideWindowZ(spec, mirrorZ);
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

  const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
  panelGeometry.translate(0, 0, -panelDepth / 2);
  const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  panelGeometry.rotateY(rotationY);
  panelGeometry.computeVertexNormals();

  return {
    geometry: panelGeometry,
    position: [panelCenterX, panelHeight / 2, panelCenterZ] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  };
}

function makeRightFacadePanels(mirrorZ: (z: number) => number) {
  const panelDepth = exteriorThickness;
  const openingsBySegmentId: Record<SegmentId, Opening[]> = {
    R_A: [],
    R_B: [],
    R_C: [],
  };

  sideWindowSpecs.forEach((spec) => {
    const zCenter = sideWindowZ(spec, mirrorZ);
    const segment = segmentForZ(zCenter);
    const widthZ = spec.width;
    const y0 = spec.groundY0;
    const y1 = spec.groundY1;

    openingsBySegmentId[segment.id].push({ id: spec.id, zCenter, widthZ, y0, y1 });
  });

  return RIGHT_FACADE_SEGMENTS.map((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const holes: Opening[] = openingsBySegmentId[segment.id];
    const panelBaseY = 0;

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
      path.moveTo(zMin - panelCenterZ, yMin - (panelBaseY + wallHeight / 2));
      path.lineTo(zMax - panelCenterZ, yMin - (panelBaseY + wallHeight / 2));
      path.lineTo(zMax - panelCenterZ, yMax - (panelBaseY + wallHeight / 2));
      path.lineTo(zMin - panelCenterZ, yMax - (panelBaseY + wallHeight / 2));
      path.closePath();
      shape.holes.push(path);
    });

    const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    panelGeometry.translate(0, 0, -panelDepth / 2);
    panelGeometry.rotateY(-Math.PI / 2);
    panelGeometry.computeVertexNormals();

    console.log('✅ RIGHT PANEL', segment.id, { holeCount: holes.length, z0: segment.z0, z1: segment.z1, x: segment.x });

    return {
      geometry: panelGeometry,
      position: [segment.x - panelDepth / 2, wallHeight / 2, panelCenterZ] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  });
}

function segmentForZ(zCenter: number) {
  if (zCenter < 4.0) return RIGHT_FACADE_SEGMENTS[0];
  if (zCenter < 8.45) return RIGHT_FACADE_SEGMENTS[1];
  return RIGHT_FACADE_SEGMENTS[2];
}
