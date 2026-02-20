import type { FacadeWindowPlacement } from './FacadeWindowPlacement';
import type { OpeningCut } from './OpeningCut';
import type { FacadeContext } from '../builders/facadeContext';

export type FacadePlan = {
  ctx: FacadeContext;
  placements: FacadeWindowPlacement[];
  openingCuts: OpeningCut[];
};
