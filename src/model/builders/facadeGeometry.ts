import type { FacadeContext } from '../../engine/geometry/facadeContext';
import { getOuterWallXAtZ } from '../../engine/geometry/wallSurfaceResolver';

export function resolveFacadeX(ctx: FacadeContext, z: number): number {
  // IMPORTANT: side walls can step/indent; must resolve X at this Z
  return getOuterWallXAtZ(ctx.outward as 1 | -1, z);
}
