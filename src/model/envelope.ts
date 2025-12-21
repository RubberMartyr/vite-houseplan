import { EnvelopePoint, envelopeOutline, originOffset } from './houseSpec';

export type FootprintPoint = EnvelopePoint;

function polygonArea(points: EnvelopePoint[]): number {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.z - next.x * point.z;
  }, 0);
}

function ensureClockwise(points: EnvelopePoint[]): EnvelopePoint[] {
  return polygonArea(points) > 0 ? [...points].reverse() : points;
}

const envelopeOuterPolygon = (() => {
  const clockwise = ensureClockwise(envelopeOutline);
  const first = clockwise[0];
  const last = clockwise[clockwise.length - 1];
  const isClosed = first.x === last.x && first.z === last.z;
  const closed = isClosed ? clockwise : [...clockwise, first];
  return closed;
})();

type Line2D = {
  point: EnvelopePoint;
  direction: { x: number; z: number };
};

function normalizeVector(dx: number, dz: number): { x: number; z: number } {
  const length = Math.hypot(dx, dz) || 1;
  return { x: dx / length, z: dz / length };
}

function lineIntersection(l1: Line2D, l2: Line2D): EnvelopePoint {
  const cross = (a: { x: number; z: number }, b: { x: number; z: number }) => a.x * b.z - a.z * b.x;
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

export function getEnvelopeInnerPolygon(thickness: number, outerPolygon?: FootprintPoint[]): FootprintPoint[] {
  const outer = outerPolygon ?? getEnvelopeOuterPolygon();
  const openOuter = outer.slice(0, -1);

  if (openOuter.length === 0) {
    return outer;
  }

  const area = polygonArea(openOuter);
  const isClockwise = area < 0;

  const offsetLines: Line2D[] = openOuter.map((point, index) => {
    const next = openOuter[(index + 1) % openOuter.length];
    const direction = normalizeVector(next.x - point.x, next.z - point.z);
    const leftNormal = { x: -direction.z, z: direction.x };
    const inwardNormal = isClockwise ? { x: -leftNormal.x, z: -leftNormal.z } : leftNormal;

    return {
      point: {
        x: point.x + inwardNormal.x * thickness,
        z: point.z + inwardNormal.z * thickness,
      },
      direction,
    };
  });

  const insetPolygon: FootprintPoint[] = offsetLines.map((line, index) => {
    const prevLine = offsetLines[(index - 1 + offsetLines.length) % offsetLines.length];
    return lineIntersection(prevLine, line);
  });

  const first = insetPolygon[0];
  const last = insetPolygon[insetPolygon.length - 1];
  const isClosed = first.x === last.x && first.z === last.z;
  return isClosed ? insetPolygon : [...insetPolygon, first];
}

let hasLoggedEnvelope = false;

export function getEnvelopeOuterPolygon(): FootprintPoint[] {
  if (!hasLoggedEnvelope) {
    const first = envelopeOuterPolygon[0];
    const last = envelopeOuterPolygon[envelopeOuterPolygon.length - 1];
    const isClosed = first.x === last.x && first.z === last.z;
    console.log('Envelope outer polygon (closed):', envelopeOuterPolygon);
    console.log('First equals last:', isClosed, 'first:', first, 'last:', last);
    hasLoggedEnvelope = true;
  }
  return envelopeOuterPolygon;
}

function clipPolygonAtMaxZ(points: FootprintPoint[], maxZ: number): FootprintPoint[] {
  const result: FootprintPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];

    const currentInside = current.z <= maxZ + 1e-9;
    const nextInside = next.z <= maxZ + 1e-9;

    if (currentInside) {
      result.push(current);
    }

    if (currentInside !== nextInside) {
      const t = (maxZ - current.z) / (next.z - current.z);
      result.push({
        x: current.x + (next.x - current.x) * t,
        z: maxZ,
      });
    }
  }

  const first = result[0];
  const last = result[result.length - 1];
  if (first && last && (first.x !== last.x || first.z !== last.z)) {
    result.push(first);
  }

  return ensureClockwise(result);
}

function closePolygon(points: FootprintPoint[]): FootprintPoint[] {
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && (first.x !== last.x || first.z !== last.z)) {
    return [...points, first];
  }
  return points;
}

function getRearWidthBounds(points: FootprintPoint[]): { minX: number; maxX: number; maxZ: number } {
  const maxZ = points.reduce((max, point) => Math.max(max, point.z), -Infinity);
  const rearPoints = points.filter((point) => Math.abs(point.z - maxZ) < 1e-6);
  return {
    minX: rearPoints.reduce((min, point) => Math.min(min, point.x), Infinity),
    maxX: rearPoints.reduce((max, point) => Math.max(max, point.x), -Infinity),
    maxZ,
  };
}

function adjustRearWidth(
  points: FootprintPoint[],
  rearMinX: number,
  rearMaxX: number,
  rearZ: number
): FootprintPoint[] {
  const epsilon = 1e-6;
  const midX = (rearMinX + rearMaxX) / 2;
  const adjusted = points.map((point) => {
    if (Math.abs(point.z - rearZ) < epsilon) {
      return {
        ...point,
        x: point.x <= midX ? rearMinX : rearMaxX,
      };
    }
    return point;
  });

  return closePolygon(ensureClockwise(adjusted));
}

export const envelopeFirstOuter = (() => {
  const maxDepth = 12;
  const clipped = clipPolygonAtMaxZ(getEnvelopeOuterPolygon(), maxDepth);
  const { minX, maxX } = getRearWidthBounds(getEnvelopeOuterPolygon());
  return adjustRearWidth(clipped, minX, maxX, maxDepth);
})();

export function getEnvelopeFirstOuterPolygon(maxDepth = 12): FootprintPoint[] {
  if (Math.abs(maxDepth - 12) < 1e-6) {
    return envelopeFirstOuter;
  }
  const clipped = clipPolygonAtMaxZ(getEnvelopeOuterPolygon(), maxDepth);
  const { minX, maxX } = getRearWidthBounds(getEnvelopeOuterPolygon());
  return adjustRearWidth(clipped, minX, maxX, maxDepth);
}

export function getFlatRoofPolygon(): FootprintPoint[] {
  const envelope = getEnvelopeOuterPolygon();
  const maxZ = envelope.reduce((max, point) => Math.max(max, point.z), -Infinity);
  const rearPoints = envelope.filter((point) => Math.abs(point.z - maxZ) < 1e-6);
  const minX = rearPoints.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = rearPoints.reduce((max, point) => Math.max(max, point.x), -Infinity);

  const startZ = maxZ - 3;
  const rectangle: FootprintPoint[] = [
    { x: minX, z: startZ },
    { x: maxX, z: startZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ },
  ];

  const clockwise = ensureClockwise(rectangle);
  const first = clockwise[0];
  const last = clockwise[clockwise.length - 1];
  const isClosed = first.x === last.x && first.z === last.z;

  return isClosed ? clockwise : [...clockwise, first];
}

// Exterior footprint polygon, ordered and including all facade indents.
export const footprintPolygon: FootprintPoint[] = getEnvelopeOuterPolygon();
export { originOffset };
