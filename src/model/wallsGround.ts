import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, wallThickness } from './houseSpec';

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const EPSILON = 0.005;

export const wallsGround = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const rearEdgePoints = outer.filter((point) => Math.abs(point.z - rearZ) < 1e-6);
    const leftX = rearEdgePoints.reduce((min, point) => Math.min(min, point.x), Infinity);

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

    const g = geometry.toNonIndexed();
    const position = g.getAttribute('position');
    const uv = g.getAttribute('uv');

    const inRect = (x: number, y: number, rect: { xMin: number; xMax: number; yMin: number; yMax: number }) =>
      x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax;

    const openings = [
      {
        xMin: leftX + 1.0,
        xMax: leftX + 1.0 + 5.6,
        yMin: 0.0,
        yMax: 2.45,
      },
    ];

    const keptPositions: number[] = [];
    const keptUvs: number[] = [];
    const triangleCount = position.count / 3;

    for (let tri = 0; tri < triangleCount; tri += 1) {
      const baseIndex = tri * 3;
      const indices = [baseIndex, baseIndex + 1, baseIndex + 2];

      let cx = 0;
      let cy = 0;
      let cz = 0;

      indices.forEach((index) => {
        cx += position.getX(index);
        cy += position.getY(index);
        cz += position.getZ(index);
      });

      cx /= 3;
      cy /= 3;
      cz /= 3;

      const isOnRear = Math.abs(cz - rearZ) < EPSILON;
      const insideOpening = openings.some((rect) => inRect(cx, cy, rect));

      if (isOnRear && insideOpening) {
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

    console.log("✅ wallsGround rear openings applied", Date.now());

    return {
      geometry: filteredGeometry,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
