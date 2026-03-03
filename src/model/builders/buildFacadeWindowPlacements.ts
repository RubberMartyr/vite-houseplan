import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import { wallThickness } from '../houseSpec';
import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { FacadeContext } from './facadeContext';
import { getWallPlanesAtZ } from './wallSurfaceResolver';
import type { SideWindowSpec } from './windowFactory';

function placementHeight(spec: SideWindowSpec): number {
  return spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) - spec.groundY0 : spec.groundY1 - spec.groundY0;
}

export function buildFacadeWindowPlacements(ctx: FacadeContext, specs: SideWindowSpec[]): FacadeWindowPlacement[] {
  return specs.map((spec) => {
    const zCenter = spec.zCenter;
    const { xOuter: xFace } = getWallPlanesAtZ(ctx.outward, zCenter, wallThickness.exterior ?? 0.3);
    const xOuterPlane = xFace - ctx.outward * FACADE_PANEL_PLANE_OFFSET;

    if (import.meta.env.DEV) {
      console.log('WINDOW PLANE', ctx.facade, {
        z: zCenter,
        xFace,
        xOuterPlane,
      });
    }

    return {
      spec,
      xOuterPlane,
      zCenter,
      width: spec.width,
      height: placementHeight(spec),
    };
  });
}
