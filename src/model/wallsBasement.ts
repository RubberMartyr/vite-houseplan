import { ExtrudeGeometry, Path, Shape } from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { wallThickness } from './houseSpec';

const wallHeight = 2.0;
const exteriorThickness = wallThickness.exterior;
const basementFloorLevel = -2.0;

export const wallsBasement = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);

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

    return {
      geometry,
      position: [0, basementFloorLevel, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
