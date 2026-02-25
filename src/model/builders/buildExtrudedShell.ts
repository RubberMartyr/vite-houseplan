import { ExtrudeGeometry, Path, Shape } from 'three';
import { FootprintPoint } from '../envelope';
import { archToWorldXZ } from '../../engine/spaceMapping';

export interface ShellResult {
  geometry: ExtrudeGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
}

function toShapePoints(points: FootprintPoint[]): FootprintPoint[] {
  const isClosed =
    points.length > 1 && points[0].x === points[points.length - 1].x && points[0].z === points[points.length - 1].z;
  return isClosed ? points.slice(0, -1) : points;
}

export function buildExtrudedShell(params: {
  outerPoints: FootprintPoint[];
  innerPoints: FootprintPoint[];
  height: number;
  baseY: number;
}): ShellResult {
  const { outerPoints, innerPoints, height, baseY } = params;

  const outerShape = new Shape();
  toShapePoints(outerPoints).forEach((point, index) => {
    const wp = archToWorldXZ(point);
    if (index === 0) {
      outerShape.moveTo(wp.x, wp.z);
      return;
    }
    outerShape.lineTo(wp.x, wp.z);
  });
  outerShape.closePath();

  const holePath = new Path();
  toShapePoints(innerPoints).forEach((point, index) => {
    const wp = archToWorldXZ(point);
    if (index === 0) {
      holePath.moveTo(wp.x, wp.z);
      return;
    }
    holePath.lineTo(wp.x, wp.z);
  });
  holePath.closePath();
  outerShape.holes.push(holePath);

  const geometry = new ExtrudeGeometry(outerShape, { depth: height, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);

  return {
    geometry,
    position: [0, baseY, 0],
    rotation: [0, 0, 0],
  };
}
