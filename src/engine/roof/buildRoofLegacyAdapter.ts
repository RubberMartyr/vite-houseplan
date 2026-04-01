import * as THREE from 'three';
import type { MultiPlaneRoofSpec } from '../types';
import type { ArchitecturalHouse } from '../architecturalTypes';
import { deriveHouse } from '../derive/deriveHouse';
import { deriveGableRoofGeometries } from '../deriveGableRoofs';
import { normalizeMultiPlaneRoof } from './normalizeMultiPlaneRoof';
import { deriveRoofPlan } from './deriveRoofPlan';
import { deriveSeamBases } from './deriveSeamBases';
import { deriveHipCapRegions } from './deriveHipCapRegions';
import { deriveRidgeSideRegions } from './deriveRidgeSideRegions';

export type LegacyRoofAdapterOutput = {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  plans: ReturnType<typeof deriveRoofPlan>[];
  seamBases: ReturnType<typeof deriveSeamBases>;
  regions: Array<ReturnType<typeof deriveHipCapRegions>[number] | ReturnType<typeof deriveRidgeSideRegions>[number]>;
};

export function buildRoofLegacyAdapter(house: ArchitecturalHouse): LegacyRoofAdapterOutput {
  const derivedHouse = deriveHouse(house);
  const geometries = deriveGableRoofGeometries(derivedHouse.roofs);

  const plans = derivedHouse.roofs
    .map((derivedRoof) => {
      const roof = derivedRoof.spec;
      if (!roof || roof.type !== 'multi-plane') return null;
      return deriveRoofPlan(derivedRoof, normalizeMultiPlaneRoof(roof as MultiPlaneRoofSpec));
    })
    .filter((plan): plan is ReturnType<typeof deriveRoofPlan> => Boolean(plan));

  const seamBases = plans.flatMap((plan) => deriveSeamBases(plan));
  const regions = plans.flatMap((plan) => {
    const planSeamBases = deriveSeamBases(plan);
    return [...deriveHipCapRegions(plan), ...deriveRidgeSideRegions(plan, planSeamBases)];
  });

  return {
    meshes: geometries.map((geometry) => ({
      geometry,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    })),
    plans,
    seamBases,
    regions,
  };
}
