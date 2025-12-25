import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { sideLeftWindowCenters } from './windowsSideLeft';
import { ceilingHeights, wallThickness } from './houseSpec';

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const EPSILON = 0.005;

export const wallsGround = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness);
    const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
    const innerLeftX = leftX + exteriorThickness;
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const innerRearZ = rearZ - exteriorThickness;

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

      const onOuterLeft = Math.abs(x1 - leftX) < EPSILON && Math.abs(x2 - leftX) < EPSILON && Math.abs(x3 - leftX) < EPSILON;
      const onInnerLeft =
        Math.abs(x1 - innerLeftX) < EPSILON &&
        Math.abs(x2 - innerLeftX) < EPSILON &&
        Math.abs(x3 - innerLeftX) < EPSILON;

      const onOuterRear = Math.abs(z1 - rearZ) < EPSILON && Math.abs(z2 - rearZ) < EPSILON && Math.abs(z3 - rearZ) < EPSILON;
      const onInnerRear =
        Math.abs(z1 - innerRearZ) < EPSILON && Math.abs(z2 - innerRearZ) < EPSILON && Math.abs(z3 - innerRearZ) < EPSILON;

      const shouldSkip = onOuterLeft || onInnerLeft || onOuterRear || onInnerRear;

      if (shouldSkip) {
        if (onOuterLeft || onOuterRear) {
          removedOuter += 1;
        }
        if (onInnerLeft || onInnerRear) {
          removedInner += 1;
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

    const removedTotal = removedOuter + removedInner;
    console.log('✅ wallsGround left faces removed for left facade panel', { removedOuter, removedInner, removedTotal, keptTotal }, Date.now());

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

  leftFacade: (() => {
    const outer = getEnvelopeOuterPolygon();
    const leftX = outer.reduce((min, point) => Math.min(min, point.x), Infinity);
    const leftEdgePoints = outer.filter((point) => Math.abs(point.x - leftX) < 1e-6);
    const zMin = leftEdgePoints.reduce((min, point) => Math.min(min, point.z), Infinity);
    const zMax = leftEdgePoints.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const widthZ = zMax - zMin;
    const centerZ = (zMin + zMax) / 2;

    const panelHeight = wallHeight;
    const panelDepth = exteriorThickness;

    const openings = [
      { zCenter: sideLeftWindowCenters.ext, width: 1.0, yMin: 0.0, yMax: 2.15 },
      { zCenter: sideLeftWindowCenters.tall1, width: 1.0, yMin: 0.0, yMax: 5.0 },
      { zCenter: sideLeftWindowCenters.tall2, width: 1.0, yMin: 0.0, yMax: 5.0 },
      { zCenter: sideLeftWindowCenters.tall3, width: 1.0, yMin: 0.0, yMax: 5.0 },
    ];

    const clampHole = (y: number) => Math.max(0, Math.min(panelHeight, y));

    const shape = new Shape();
    shape.moveTo(-widthZ / 2, -panelHeight / 2);
    shape.lineTo(widthZ / 2, -panelHeight / 2);
    shape.lineTo(widthZ / 2, panelHeight / 2);
    shape.lineTo(-widthZ / 2, panelHeight / 2);
    shape.closePath();

    openings.forEach(({ zCenter, width, yMin, yMax }) => {
      const yMinLocal = clampHole(yMin) - panelHeight / 2;
      const yMaxLocal = clampHole(yMax) - panelHeight / 2;
      const zMinLocal = zCenter - width / 2 - centerZ;
      const zMaxLocal = zCenter + width / 2 - centerZ;

      const path = new Path();
      path.moveTo(zMinLocal, yMinLocal);
      path.lineTo(zMaxLocal, yMinLocal);
      path.lineTo(zMaxLocal, yMaxLocal);
      path.lineTo(zMinLocal, yMaxLocal);
      path.closePath();
      shape.holes.push(path);
    });

    const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    panelGeometry.translate(0, 0, -panelDepth / 2);
    panelGeometry.rotateY(-Math.PI / 2);
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [leftX + panelDepth / 2, panelHeight / 2, centerZ] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
