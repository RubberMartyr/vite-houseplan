import { useMemo } from 'react';
import type { ArchitecturalHouse } from '../architecturalTypes';
import { EngineFlatRoofs } from './EngineFlatRoofs';
import { EngineGableRoofs } from './EngineGableRoofs';
import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';
import type { DerivedRoof } from '../derive/types/DerivedRoof';

type EngineRoofsProps = {
  arch: ArchitecturalHouse;
  roofs: DerivedRoof[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
};

export function EngineRoofs({ arch, roofs, roofRevision, roofValidationEntries }: EngineRoofsProps) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  const roofSpecs = useMemo(() => roofs.map((roof) => roof.spec as MultiPlaneRoofSpec), [roofs]);

  return (
    <>
      <EngineFlatRoofs arch={arch} roofs={roofSpecs} roofRevision={roofRevision} />
      <EngineGableRoofs arch={arch} roofs={roofSpecs} roofRevision={roofRevision} invalidRoofIds={invalidRoofIds} />
    </>
  );
}
