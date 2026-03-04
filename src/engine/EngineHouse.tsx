import type { ArchitecturalHouse } from './architecturalTypes';
import type { DerivedSlab } from './derive/deriveSlabs';
import { RoofValidationOverlay } from '../view/RoofValidationOverlay';
import type { MultiPlaneRoofValidationResult } from './validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from './types';
import { EngineWalls } from './render/EngineWalls';
import { EngineSlabs } from './render/EngineSlabs';
import { EngineRoofs } from './render/EngineRoofs';

type Props = {
  architecturalHouse: ArchitecturalHouse;
  derivedSlabs: DerivedSlab[];
  roofRevision: number;
  roofValidationEntries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
  highlightedRidgeId?: string | null;
};

export function EngineHouse({ architecturalHouse, derivedSlabs, roofRevision, roofValidationEntries, highlightedRidgeId }: Props) {
  return (
    <>
      <EngineWalls arch={architecturalHouse} />
      <EngineSlabs slabs={derivedSlabs} />
      <EngineRoofs arch={architecturalHouse} roofRevision={roofRevision} roofValidationEntries={roofValidationEntries} />
      <RoofValidationOverlay entries={roofValidationEntries} highlightedRidgeId={highlightedRidgeId} />
    </>
  );
}
