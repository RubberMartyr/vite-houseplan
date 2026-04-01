import { architecturalHouse } from '../../engine/architecturalHouse';
import { deriveHouse } from '../../engine/derive/deriveHouse';
import type { MultiPlaneRoofSpec } from '../../engine/types';
import { normalizeMultiPlaneRoof } from '../../engine/roof/normalizeMultiPlaneRoof';
import { deriveRoofPlan } from '../../engine/roof/deriveRoofPlan';
import { deriveSeamBases } from '../../engine/roof/deriveSeamBases';
import { deriveHipCapRegions } from '../../engine/roof/deriveHipCapRegions';
import { deriveRidgeSideRegions } from '../../engine/roof/deriveRidgeSideRegions';
import { triangulateRoofRegion } from '../../engine/roof/triangulateRoofRegion';
import { deriveGableRoofGeometries } from '../../engine/deriveGableRoofs';
import { archToWorldXZ } from '../../engine/spaceMapping';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const derivedHouse = deriveHouse(architecturalHouse);
const multiPlanePairs = derivedHouse.roofs
  .map((derivedRoof) => ({
    derivedRoof,
    roof: derivedRoof.spec as MultiPlaneRoofSpec,
  }))
  .filter(({ roof }) => roof.type === 'multi-plane');

assert(multiPlanePairs.length > 0, 'expected at least one multi-plane roof for migration checks');

for (const { derivedRoof, roof } of multiPlanePairs) {
  const plan = deriveRoofPlan(derivedRoof, normalizeMultiPlaneRoof(roof));
  const seamBases = deriveSeamBases(plan);
  const hipRegions = deriveHipCapRegions(plan);
  const ridgeRegions = deriveRidgeSideRegions(plan, seamBases);

  assert(seamBases.length === hipRegions.length * 2, 'seam bases should still provide two points per hip cap');
  assert(ridgeRegions.every((region) => region.side === 'left' || region.side === 'right'), 'ridge regions should preserve side planes');

  for (const region of [...hipRegions, ...ridgeRegions]) {
    const triangles = triangulateRoofRegion(region);
    assert(triangles.length > 0, `region ${region.id} should triangulate`);
  }

  for (const point of plan.footprint) {
    const world = archToWorldXZ(point);
    assert(world.x === point.x && world.z === -point.z, 'roof coordinate mapping should stay centralized in spaceMapping');
  }
}

const geometries = deriveGableRoofGeometries(derivedHouse.roofs);
assert(geometries.length > 0, 'roof geometry pipeline should still produce meshes');
