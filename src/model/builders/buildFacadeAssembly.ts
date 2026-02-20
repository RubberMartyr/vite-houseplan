import type { SideWindowSpec } from './windowFactory';
import { createFacadeContext } from './facadeContext';
import { buildFacadeWindowPlacements } from './buildFacadeWindowPlacements';
import { buildSideWindows } from './buildSideWindows';
import { buildWallOpenings } from './buildWallOpenings';

export function buildFacadeAssembly({
  facade,
  windowSpecs,
}: {
  facade: 'left' | 'right';
  windowSpecs: SideWindowSpec[];
}) {
  const ctx = createFacadeContext(facade);
  const placements = buildFacadeWindowPlacements(ctx, windowSpecs);
  const windowMeshes = buildSideWindows({ ctx, placements });
  const openingCuts = buildWallOpenings(ctx, placements);

  return {
    placements,
    windowMeshes,
    openingCuts,
  };
}
