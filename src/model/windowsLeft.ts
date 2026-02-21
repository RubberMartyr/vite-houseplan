import { buildSideWindows } from './builders/buildSideWindows';
import { buildFacadeWindowPlacements } from './builders/buildFacadeWindowPlacements';
import { createFacadeContext } from './builders/facadeContext';
import { leftSideWindowSpecs } from './builders/windowFactory';

const ctx = createFacadeContext('left');
const placements = buildFacadeWindowPlacements(ctx, leftSideWindowSpecs);

export const windowsLeft = {
  meshes: buildSideWindows({ ctx, placements }),
};
