import { ExtrudeGeometry, Path, Shape } from 'three';
import { FRAME_BORDER, FRAME_DEPTH } from '../constants/windowConstants';

export function buildFrameGeometry(
  width: number,
  height: number,
  options?: { rotateForSide?: boolean }
): ExtrudeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const outerShape = new Shape();
  outerShape.moveTo(-halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, -halfHeight);

  const innerPath = new Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const geometry = new ExtrudeGeometry(outerShape, { depth: FRAME_DEPTH, bevelEnabled: false });
  geometry.translate(0, 0, -FRAME_DEPTH / 2);

  if (options?.rotateForSide) {
    geometry.rotateY(-Math.PI / 2);
    geometry.computeVertexNormals();
  }

  return geometry;
}
