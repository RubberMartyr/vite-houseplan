import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import { LEFT_FACADE_EPS, getLeftFacadeMetrics } from './leftFacade';
import { sideWindowOpenings } from './windowsSide';

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;
const firstFloorLevel = levelHeights.firstFloor;
const EPSILON = 0.005;

export const wallsFirst = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const innerRearZ = rearZ - exteriorThickness;
    const { leftX, innerLeftX } = getLeftFacadeMetrics(outer);

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
    let keptTotal = 0;
    let removedLeftOuter = 0;
    let removedLeftInner = 0;

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
      const onLeftOuter =
        Math.abs(x1 - leftX) < LEFT_FACADE_EPS &&
        Math.abs(x2 - leftX) < LEFT_FACADE_EPS &&
        Math.abs(x3 - leftX) < LEFT_FACADE_EPS;
      const onLeftInner =
        Math.abs(x1 - innerLeftX) < LEFT_FACADE_EPS &&
        Math.abs(x2 - innerLeftX) < LEFT_FACADE_EPS &&
        Math.abs(x3 - innerLeftX) < LEFT_FACADE_EPS;
      if (onRearOuter || onRearInner || onLeftOuter || onLeftInner) {
        if (onRearOuter) {
          removedOuter += 1;
        }
        if (onRearInner) {
          removedInner += 1;
        }
        if (onLeftOuter) {
          removedLeftOuter += 1;
        }
        if (onLeftInner) {
          removedLeftInner += 1;
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

    const removedTotal = removedOuter + removedInner + removedLeftOuter + removedLeftInner;
    console.log(
      '✅ wallsFirst rear/left faces removed for facade panels',
      { removedOuter, removedInner, removedLeftOuter, removedLeftInner, removedTotal, keptTotal },
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

    const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    panelGeometry.translate(0, 0, -panelDepth / 2);
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, firstFloorLevel + panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  leftFacade: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const { leftX, centerZ, widthZ } = getLeftFacadeMetrics(outer);
    const panelHeight = wallHeight;
    const panelDepth = exteriorThickness;
    const safeWidthZ = Math.max(widthZ, 0.01);
    const halfWidthZ = safeWidthZ / 2;
    const panelCenterY = firstFloorLevel + panelHeight / 2;

    const toLocalRect = (rect: { zMin: number; zMax: number; yMin: number; yMax: number }) => ({
      xMin: rect.zMin - centerZ,
      xMax: rect.zMax - centerZ,
      yMin: rect.yMin - panelCenterY,
      yMax: rect.yMax - panelCenterY,
    });

    const shape = new Shape();
    shape.moveTo(-halfWidthZ, -panelHeight / 2);
    shape.lineTo(halfWidthZ, -panelHeight / 2);
    shape.lineTo(halfWidthZ, panelHeight / 2);
    shape.lineTo(-halfWidthZ, panelHeight / 2);
    shape.closePath();

    const openings = sideWindowOpenings
      .filter((opening) => opening.level === 'first')
      .map((opening) =>
        toLocalRect({
          zMin: opening.zCenter - opening.width / 2,
          zMax: opening.zCenter + opening.width / 2,
          yMin: opening.yBottom,
          yMax: opening.yBottom + opening.height,
        })
      );

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
    panelGeometry.rotateY(Math.PI / 2);
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [leftX + panelDepth / 2, panelCenterY, centerZ] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
