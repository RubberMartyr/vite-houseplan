import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { FacadeContext } from './facadeContext';
import { resolveFacadeX } from './facadeGeometry';
import type { SideWindowSpec } from './windowFactory';

function placementHeight(spec: SideWindowSpec): number {
  return spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) - spec.groundY0 : spec.groundY1 - spec.groundY0;
}

export function buildFacadeWindowPlacements(ctx: FacadeContext, specs: SideWindowSpec[]): FacadeWindowPlacement[] {
  return specs.map((spec) => {
    const zCenter = spec.zCenter;
    const xFace = resolveFacadeX(ctx, zCenter);
    const xOuterPlane = xFace - ctx.outward * FACADE_PANEL_PLANE_OFFSET;

    if (import.meta.env.DEV) {
      console.log('WINDOW PLANE', ctx.facade, {
        z: zCenter,
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
