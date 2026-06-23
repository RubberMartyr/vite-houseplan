import type { OpeningEdgeRef, OpeningSpec, OpeningStyleSpec } from '../../architecturalTypes';
export type LeftFacadeStack = {
    id: string;
    groundEdge: OpeningEdgeRef;
    firstEdge: OpeningEdgeRef;
    width: number;
    groundHeight: number;
    firstHeight: number;
    positions: readonly {
        idSuffix?: string;
        groundOffset: number;
        firstOffset?: number;
        includeFirst: boolean;
    }[];
};
export declare function createLeftFacadeStackOpenings(stacks: readonly LeftFacadeStack[], styles: {
    lowerTall: OpeningStyleSpec;
    upperTall: OpeningStyleSpec;
    short: OpeningStyleSpec;
}): OpeningSpec[];
