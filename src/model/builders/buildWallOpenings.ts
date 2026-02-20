import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { OpeningCut } from '../types/OpeningCut';

export function buildWallOpenings(
  placements: FacadeWindowPlacement[],
): OpeningCut[] {
  return placements.map((placement) => ({
    xOuterPlane: placement.xOuterPlane,
    zCenter: placement.zCenter,
    width: placement.width,
    height: placement.height,
  }));
}
