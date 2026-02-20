import type { SideWindowSpec } from './windowFactory';
import type { FacadePlan } from '../types/FacadePlan';
import { createFacadeContext, type FacadeSide } from './facadeContext';
import { buildFacadeWindowPlacements } from './buildFacadeWindowPlacements';
import { buildWallOpenings } from './buildWallOpenings';

export function buildFacadePlan({
  facade,
  windowSpecs,
}: {
  facade: FacadeSide;
  windowSpecs: SideWindowSpec[];
}): FacadePlan {
  const ctx = createFacadeContext(facade);
  const placements = buildFacadeWindowPlacements(ctx, windowSpecs);
  const openingCuts = buildWallOpenings(ctx, placements);

  return { ctx, placements, openingCuts };
}
