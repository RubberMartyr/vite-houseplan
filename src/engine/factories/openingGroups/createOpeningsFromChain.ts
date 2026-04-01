import type { OpeningSpec } from '../../architecturalTypes';
import { computeOpeningOffsetsFromChain } from '../../geometry/facadeChains';

type OpeningFromChainInput = Omit<OpeningSpec, 'offset'>;

export function createOpeningsFromChain(config: {
  chain: number[];
  openings: OpeningFromChainInput[];
}): OpeningSpec[] {
  const offsets = computeOpeningOffsetsFromChain(config.chain);

  return config.openings.map((opening, index) => ({
    ...opening,
    offset: offsets[index] ?? 0,
  }));
}
