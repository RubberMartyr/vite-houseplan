import type { FacadeContext } from './facadeContext';
import { getOuterWallXAtZ } from './wallSurfaceResolver';

export function resolveFacadeX(ctx: FacadeContext, z: number): number {
  // IMPORTANT: side walls can step/indent; must resolve X at this Z
  return getOuterWallXAtZ(ctx.outward as 1 | -1, z);
}
