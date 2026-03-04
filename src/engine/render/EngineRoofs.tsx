import { useMemo } from 'react';
import type { ArchitecturalHouse } from '../architecturalTypes';
import { EngineFlatRoofs } from './EngineFlatRoofs';
import { EngineGableRoofs } from './EngineGableRoofs';
import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';

type EngineRoofsProps = {
  arch: ArchitecturalHouse;
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
};

export function EngineRoofs({ arch, roofRevision, roofValidationEntries }: EngineRoofsProps) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  return (
    <>
      <EngineFlatRoofs arch={arch} roofRevision={roofRevision} />
      <EngineGableRoofs arch={arch} roofRevision={roofRevision} invalidRoofIds={invalidRoofIds} />
    </>
  );
}
