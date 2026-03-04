import type { FacadeContext } from '../../engine/geometry/facadeContext';
import type { OpeningCut } from './OpeningCut';
import type { FacadeWindowPlacement } from './FacadeWindowPlacement';

export type FacadePlan = {
  ctx: FacadeContext;
  placements: FacadeWindowPlacement[];
  openingCuts: OpeningCut[];
};
