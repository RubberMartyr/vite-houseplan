import type { SideWindowSpec } from './windowFactory';
import { createFacadeContext } from './facadeContext';
import { buildFacadeWindowPlacements } from './buildFacadeWindowPlacements';
import { buildSideWindows } from './buildSideWindows';
import { buildWallOpenings } from './buildWallOpenings';
import type { FacadePlan } from '../types/FacadePlan';

type FacadeAssembly = FacadePlan & {
  windowMeshes: ReturnType<typeof buildSideWindows>;
};

export function buildFacadeAssembly({
  facade,
  windowSpecs,
}: {
  facade: 'left' | 'right';
  windowSpecs: SideWindowSpec[];
}): FacadeAssembly {
  const ctx = createFacadeContext(facade);
  const placements = buildFacadeWindowPlacements(ctx, windowSpecs);
  const windowMeshes = buildSideWindows({ ctx, placements });
  const openingCuts = buildWallOpenings(ctx, placements);

  return {
    ctx,
    placements,
    windowMeshes,
    openingCuts,
  };
}
