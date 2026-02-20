import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { FacadeContext } from './facadeContext';
import { resolveFacadeX } from './facadeGeometry';
import { TALL_Z_OFFSET_TO_FRONT, type SideWindowSpec } from './windowFactory';

function placementHeight(spec: SideWindowSpec): number {
  return spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) - spec.groundY0 : spec.groundY1 - spec.groundY0;
}

export function buildFacadeWindowPlacements(ctx: FacadeContext, specs: SideWindowSpec[]): FacadeWindowPlacement[] {
  return specs.map((spec) => {
    const zCenter = spec.kind === 'tall' ? spec.zCenter - TALL_Z_OFFSET_TO_FRONT : spec.zCenter;
    const xFace = resolveFacadeX(ctx, zCenter);
    const xOuterPlane = xFace - ctx.outward * FACADE_PANEL_PLANE_OFFSET;

    return {
      spec,
      xOuterPlane,
      zCenter,
      width: spec.width,
      height: placementHeight(spec),
    };
  });
}
