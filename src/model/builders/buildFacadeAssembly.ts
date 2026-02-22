import type { SideWindowSpec } from './windowFactory';
import { buildFacadePlan } from './buildFacadePlan';
import type { FacadePlan } from '../types/FacadePlan';
import type { FacadeSide } from './facadeContext';

type FacadeAssembly = FacadePlan & {
  windowMeshes: [];
};

export function buildFacadeAssembly({
  facade,
  windowSpecs,
}: {
  facade: FacadeSide;
  windowSpecs: SideWindowSpec[];
}): FacadeAssembly {
  const plan = buildFacadePlan({ facade, windowSpecs });

  return {
    ...plan,
    windowMeshes: [],
  };
}
