export type Vec2XZ = { x: number; z: number };

const EPSILON = 1e-6;

function signedArea(points: Vec2XZ[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.z - p2.x * p1.z;
  }
  return area / 2;
}

function normalize(v: Vec2XZ): Vec2XZ {
  const len = Math.hypot(v.x, v.z);
  if (len < EPSILON) {
    return { x: 0, z: 0 };
  }
  return { x: v.x / len, z: v.z / len };
}

function lineIntersection(
  p1: Vec2XZ,
  d1: Vec2XZ,
  p2: Vec2XZ,
  d2: Vec2XZ
): Vec2XZ | null {
  const det = d1.x * d2.z - d1.z * d2.x;
  if (Math.abs(det) < EPSILON) {
    return null;
  }

  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const t = (dx * d2.z - dz * d2.x) / det;

  return {
    x: p1.x + d1.x * t,
    z: p1.z + d1.z * t,
  };
}

function removeDuplicateConsecutive(points: Vec2XZ[]): Vec2XZ[] {
  if (points.length <= 1) {
    return points;
  }

  const deduped: Vec2XZ[] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.z - prev.z) > EPSILON) {
      deduped.push(point);
    }
  }

  if (deduped.length > 1) {
    const first = deduped[0];
    const last = deduped[deduped.length - 1];
    if (Math.hypot(first.x - last.x, first.z - last.z) <= EPSILON) {
      deduped.pop();
    }
  }

  return deduped;
}

export function offsetPolygonInward(points: Vec2XZ[], offset: number): Vec2XZ[] {
  if (points.length < 3 || offset <= 0) {
    return [...points];
  }

  const area = signedArea(points);
  const isCcw = area > 0;
  const miterLimit = 6 * offset;

  const result: Vec2XZ[] = [];

  for (let i = 0; i < points.length; i += 1) {
    const pPrev = points[(i - 1 + points.length) % points.length];
    const p = points[i];
    const pNext = points[(i + 1) % points.length];

    const e1 = normalize({ x: p.x - pPrev.x, z: p.z - pPrev.z });
    const e2 = normalize({ x: pNext.x - p.x, z: pNext.z - p.z });

    if ((e1.x === 0 && e1.z === 0) || (e2.x === 0 && e2.z === 0)) {
      continue;
    }

    const outwardNormal = (edge: Vec2XZ): Vec2XZ =>
      isCcw ? { x: edge.z, z: -edge.x } : { x: -edge.z, z: edge.x };

    const n1Out = outwardNormal(e1);
    const n2Out = outwardNormal(e2);

    const n1 = { x: -n1Out.x, z: -n1Out.z };
    const n2 = { x: -n2Out.x, z: -n2Out.z };

    const l1Point = { x: p.x + n1.x * offset, z: p.z + n1.z * offset };
    const l2Point = { x: p.x + n2.x * offset, z: p.z + n2.z * offset };

    const intersection = lineIntersection(l1Point, e1, l2Point, e2);

    if (!intersection) {
      result.push(l1Point, l2Point);
      continue;
    }

    const miterLength = Math.hypot(intersection.x - p.x, intersection.z - p.z);

    if (miterLength > miterLimit) {
      result.push(l1Point, l2Point);
    } else {
      result.push(intersection);
    }
  }

  return removeDuplicateConsecutive(result);
}
