import { buildSideWindows } from './builders/buildSideWindows';
import { buildFacadeWindowPlacements } from './builders/buildFacadeWindowPlacements';
import { createFacadeContext } from './builders/facadeContext';
import { sideWindowSpecs } from './builders/windowFactory';

const ctx = createFacadeContext('left');
const placements = buildFacadeWindowPlacements(ctx, sideWindowSpecs);

export const windowsLeft = {
  meshes: buildSideWindows({ ctx, placements }),
};
