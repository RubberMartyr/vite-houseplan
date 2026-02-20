import type { SideWindowSpec } from './windowFactory';
import { buildFacadePlan } from './buildFacadePlan';
import { buildSideWindows } from './buildSideWindows';
import type { FacadePlan } from '../types/FacadePlan';
import type { FacadeSide } from './facadeContext';

type FacadeAssembly = FacadePlan & {
  windowMeshes: ReturnType<typeof buildSideWindows>;
};

export function buildFacadeAssembly({
  facade,
  windowSpecs,
}: {
  facade: FacadeSide;
  windowSpecs: SideWindowSpec[];
}): FacadeAssembly {
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
