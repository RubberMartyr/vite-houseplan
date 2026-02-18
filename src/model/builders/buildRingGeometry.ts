import { ExtrudeGeometry, Path, Shape } from 'three';

export function buildRingGeometry(params: {
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
  depth: number;
  centerDepth?: boolean;
}): ExtrudeGeometry {
  const { outerWidth, outerHeight, innerWidth, innerHeight, depth, centerDepth = true } = params;

  const shape = new Shape();
  shape.moveTo(-outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, outerHeight / 2);
  shape.lineTo(-outerWidth / 2, outerHeight / 2);
  shape.closePath();

  const hole = new Path();
  hole.moveTo(-innerWidth / 2, -innerHeight / 2);
  hole.lineTo(innerWidth / 2, -innerHeight / 2);
  hole.lineTo(innerWidth / 2, innerHeight / 2);
  hole.lineTo(-innerWidth / 2, innerHeight / 2);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  if (centerDepth) {
    geometry.translate(0, 0, -depth / 2);
  }

  return geometry;
}
