import { EnvelopePoint, originOffset } from './houseSpec';
export type FootprintPoint = EnvelopePoint;
export declare function getEnvelopeInnerPolygon(thickness: number, outerPolygon?: FootprintPoint[]): FootprintPoint[];
export declare function getEnvelopeOuterPolygon(): FootprintPoint[];
export declare const envelopeFirstOuter: EnvelopePoint[];
export declare function getEnvelopeFirstOuterPolygon(maxDepth?: number): FootprintPoint[];
export declare function getFlatRoofPolygon(): FootprintPoint[];
export declare const footprintPolygon: FootprintPoint[];
export { originOffset };
