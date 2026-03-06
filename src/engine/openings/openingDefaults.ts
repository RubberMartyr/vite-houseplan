import type { OpeningStyleSpec } from '../architecturalTypes';

export type NormalizedOpeningStyleCore = Required<
  Pick<
    OpeningStyleSpec,
    'frameThickness' | 'frameDepth' | 'glassInset' | 'glassThickness'
  >
>;

export const DEFAULT_OPENING_STYLE: NormalizedOpeningStyleCore = {
  frameThickness: 0.05,
  frameDepth: 0.12,
  glassInset: 0.02,
  glassThickness: 0.01,
};
