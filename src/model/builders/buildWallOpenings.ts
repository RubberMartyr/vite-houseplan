import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { OpeningCut } from '../types/OpeningCut';
import type { FacadeContext } from './facadeContext';

export function buildWallOpenings(
  _ctx: FacadeContext,
  placements: FacadeWindowPlacement[],
): OpeningCut[] {
  return placements.map((placement) => ({
    xOuterPlane: placement.xOuterPlane,
    zCenter: placement.zCenter,
    width: placement.width,
    height: placement.height,
  }));
}

