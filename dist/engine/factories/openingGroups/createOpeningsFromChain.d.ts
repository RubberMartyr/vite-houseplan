import type { OpeningSpec } from '../../architecturalTypes';
type OpeningFromChainInput = Omit<OpeningSpec, 'offset'>;
export declare function createOpeningsFromChain(config: {
    chain: number[];
    openings: OpeningFromChainInput[];
}): OpeningSpec[];
export {};
