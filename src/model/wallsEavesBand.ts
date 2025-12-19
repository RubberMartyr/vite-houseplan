import { ExtrudeGeometry, Path, Shape } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { wallThickness } from './houseSpec';

const bandBaseY = 5.1;
const bandHeight = 0.6;
const exteriorThickness = wallThickness.exterior;

export const wallsEavesBand = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
    const bounds = outer.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minZ: Math.min(acc.minZ, point.z),
        maxZ: Math.max(acc.maxZ, point.z),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minZ: Number.POSITIVE_INFINITY,
        maxZ: Number.NEGATIVE_INFINITY,
      }
    );
    console.log('EAVES BAND footprint bounds', bounds);

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

    const geometry = new ExtrudeGeometry(outerShape, { depth: bandHeight, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);

    return {
      geometry,
      position: [0, bandBaseY, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
