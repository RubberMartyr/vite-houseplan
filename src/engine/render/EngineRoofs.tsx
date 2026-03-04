import { useMemo } from 'react';
import { EngineFlatRoofs } from './EngineFlatRoofs';
import { EngineGableRoofs } from './EngineGableRoofs';
import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';
import type { DerivedRoof } from '../derive/types/DerivedRoof';

type EngineRoofsProps = {
  roofs: DerivedRoof[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
};

export function EngineRoofs({ roofs, roofRevision, roofValidationEntries }: EngineRoofsProps) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  return (
    <>
      <EngineFlatRoofs roofs={roofs} roofRevision={roofRevision} />
      <EngineGableRoofs roofs={roofs} roofRevision={roofRevision} invalidRoofIds={invalidRoofIds} />
    </>
  );
}
