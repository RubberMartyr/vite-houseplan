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

function offsetEdge(
  start: EnvelopePoint,
  end: EnvelopePoint,
  inset: number,
  inwardNormal: { x: number; z: number }
): [EnvelopePoint, EnvelopePoint] {
  return [
    { x: start.x + inwardNormal.x * inset, z: start.z + inwardNormal.z * inset },
    { x: end.x + inwardNormal.x * inset, z: end.z + inwardNormal.z * inset },
  ];
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

export function getEnvelopeInnerPolygon(inset: number): FootprintPoint[] {
  const outer = getEnvelopeOuterPolygon();

  const insetEdges = outer.slice(0, -1).map((point, index) => {
    const next = outer[index + 1];
    const direction = normalizeVector(next.x - point.x, next.z - point.z);
    const inwardNormal = { x: direction.z, z: -direction.x };
    const [offsetStart, offsetEnd] = offsetEdge(point, next, inset, inwardNormal);

    return {
      offsetStart,
      offsetEnd,
      direction,
    };
  });

  const insetPolygon: FootprintPoint[] = insetEdges.map((edge, index) => {
    const prevEdge = insetEdges[(index - 1 + insetEdges.length) % insetEdges.length];

    const lineA: Line2D = {
      point: edge.offsetStart,
      direction: edge.offsetEnd && edge.offsetStart
        ? { x: edge.offsetEnd.x - edge.offsetStart.x, z: edge.offsetEnd.z - edge.offsetStart.z }
        : { x: edge.direction.x, z: edge.direction.z },
    };

    const lineB: Line2D = {
      point: prevEdge.offsetStart,
      direction: prevEdge.offsetEnd && prevEdge.offsetStart
        ? { x: prevEdge.offsetEnd.x - prevEdge.offsetStart.x, z: prevEdge.offsetEnd.z - prevEdge.offsetStart.z }
        : { x: prevEdge.direction.x, z: prevEdge.direction.z },
    };

    return lineIntersection(lineB, lineA);
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

// Exterior footprint polygon, ordered and including all facade indents.
export const footprintPolygon: FootprintPoint[] = getEnvelopeOuterPolygon();
export { originOffset };
