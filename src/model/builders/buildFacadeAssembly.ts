import type { SideWindowSpec } from './windowFactory';
import { buildFacadePlan } from './buildFacadePlan';
import { buildSideWindows } from './buildSideWindows';
import type { FacadeSide } from './facadeContext';

export function buildFacadeAssembly({
  facade,
  windowSpecs,
}: {
  facade: FacadeSide;
  windowSpecs: SideWindowSpec[];
}) {
  const plan = buildFacadePlan({ facade, windowSpecs });
  const windowMeshes = buildSideWindows({
    ctx: plan.ctx,
    placements: plan.placements,
  });

  return {
    ...plan,
    windowMeshes,
  };
}
