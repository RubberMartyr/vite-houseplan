import { memo, useMemo } from 'react';
import { EngineFlatRoofs } from './EngineFlatRoofs';
import { EngineGableRoofs } from './EngineGableRoofs';
import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import type { ArchitecturalMaterials } from '../architecturalTypes';

type EngineRoofsProps = {
  roofs: DerivedRoof[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
  visible?: boolean;
  roofMaterialSpec?: ArchitecturalMaterials['roof'];
};

export const EngineRoofs = memo(function EngineRoofs({ roofs, roofRevision, roofValidationEntries, visible = true, roofMaterialSpec }: EngineRoofsProps) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  return (
    <>
      <EngineFlatRoofs
        roofs={roofs}
        roofRevision={roofRevision}
        visible={visible}
        roofMaterialSpec={roofMaterialSpec}
      />
      <EngineGableRoofs
        roofs={roofs}
        roofRevision={roofRevision}
        invalidRoofIds={invalidRoofIds}
        visible={visible}
        roofMaterialSpec={roofMaterialSpec}
      />
    </>
  );
});
