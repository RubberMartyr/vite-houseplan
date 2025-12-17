import { EnvelopePoint, envelopeOutline, originOffset } from './houseSpec';

export type FootprintPoint = EnvelopePoint;

// Exterior footprint polygon, ordered and including all facade indents.
export const footprintPolygon: FootprintPoint[] = envelopeOutline;

export { originOffset };
