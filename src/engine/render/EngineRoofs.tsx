import { useMemo } from 'react';
import { EngineFlatRoofs } from './EngineFlatRoofs';
import { EngineGableRoofs } from './EngineGableRoofs';
import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import type { MaterialSpec } from '../materials/resolveMaterial';

type EngineRoofsProps = {
  roofs: DerivedRoof[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
  roofMaterialSpec?: MaterialSpec;
};

export function EngineRoofs({ roofs, roofRevision, roofValidationEntries, roofMaterialSpec }: EngineRoofsProps) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  return (
    <>
      <EngineFlatRoofs roofs={roofs} roofRevision={roofRevision} roofMaterialSpec={roofMaterialSpec} />
      <EngineGableRoofs
        roofs={roofs}
        roofRevision={roofRevision}
        invalidRoofIds={invalidRoofIds}
        roofMaterialSpec={roofMaterialSpec}
      />
    </>
  );
}
