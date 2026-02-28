import React, { useMemo } from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import type { DerivedSlab } from './derive/deriveSlabs';
import { EngineFlatRoofsDebug } from '../view/EngineFlatRoofsDebug';
import { EngineGableRoofsDebug } from '../view/EngineGableRoofsDebug';
import { EngineSlabsDebug } from '../view/EngineSlabsDebug';
import { EngineWallShellsDebug } from '../view/EngineWallShellsDebug';
import { RoofValidationOverlay } from '../view/RoofValidationOverlay';
import type { MultiPlaneRoofValidationResult } from './validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from './types';

type Props = {
  debugEngineWalls: boolean;
  architecturalHouse: ArchitecturalHouse;
  derivedSlabs: DerivedSlab[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
  highlightedRidgeId?: string | null;
};

export function EngineHouse({ debugEngineWalls, architecturalHouse, derivedSlabs, roofRevision, roofValidationEntries, highlightedRidgeId }: Props) {
  const invalidRoofIds = useMemo(
    () => new Set(roofValidationEntries.filter((entry) => entry.validation.errors.length > 0).map((entry) => entry.roof.id)),
    [roofValidationEntries]
  );

  return (
    <>
      <EngineWallShellsDebug visible={debugEngineWalls} arch={architecturalHouse} />
      <EngineSlabsDebug visible={debugEngineWalls} slabs={derivedSlabs} />
      <EngineFlatRoofsDebug arch={architecturalHouse} roofRevision={roofRevision} />
      <EngineGableRoofsDebug arch={architecturalHouse} roofRevision={roofRevision} invalidRoofIds={invalidRoofIds} />
      <RoofValidationOverlay entries={roofValidationEntries} highlightedRidgeId={highlightedRidgeId} />
    </>
  );
}
