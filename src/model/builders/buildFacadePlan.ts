import type { FacadePlan } from '../types/FacadePlan';
import { buildFacadeWindowPlacements } from './buildFacadeWindowPlacements';
import { buildWallOpenings } from './buildWallOpenings';
import { type FacadeSide, createFacadeContext } from './facadeContext';
import type { SideWindowSpec } from './windowFactory';

export function buildFacadePlan({
  facade,
  windowSpecs,
}: {
  facade: FacadeSide;
  windowSpecs: SideWindowSpec[];
}): FacadePlan {
  const ctx = createFacadeContext(facade);
  const placements = buildFacadeWindowPlacements(ctx, windowSpecs);
  const openingCuts = buildWallOpenings(placements);

  return { ctx, placements, openingCuts };
}
