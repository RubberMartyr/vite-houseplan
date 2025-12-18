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
