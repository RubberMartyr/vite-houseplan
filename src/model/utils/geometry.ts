export type Point2D = { x: number; z: number };

export type Line2D = {
  point: Point2D;
  direction: Point2D;
};

export function polygonArea(points: Point2D[]): number {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.z - next.x * point.z;
  }, 0);
}

export function ensureClockwise(points: Point2D[]): Point2D[] {
  return polygonArea(points) > 0 ? [...points].reverse() : points;
}

export function ensureCounterClockwise(points: Point2D[]): Point2D[] {
  return polygonArea(points) < 0 ? [...points].reverse() : points;
}

export function normalizeVector(dx: number, dz: number): Point2D {
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length };
}

export function lineIntersection(l1: Line2D, l2: Line2D): Point2D {
  const cross = (a: Point2D, b: Point2D) => a.x * b.z - a.z * b.x;
  const denominator = cross(l1.direction, l2.direction);

  if (Math.abs(denominator) < 1e-10) {
    return l1.point;
  }

  const diff = { x: l2.point.x - l1.point.x, z: l2.point.z - l1.point.z };
  const t = cross(diff, l2.direction) / denominator;

  return {
    x: l1.point.x + l1.direction.x * t,
    z: l1.point.z + l1.direction.z * t,
  };
}
