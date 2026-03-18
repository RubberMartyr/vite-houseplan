import { useMemo } from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import { deriveHouse } from './derive/deriveHouse';
import { EngineDebugHUD } from './debug/EngineDebugHUD';
import { DerivedGraphOverlay } from './debug/DerivedGraphOverlay';
import { RoofPlaneVisualizer } from './debug/RoofPlaneVisualizer';
import type { DerivedHouse } from './derive/types/DerivedHouse';
import { EngineOpenings } from './render/EngineOpenings';
import { EngineRoofs } from './render/EngineRoofs';
import { EngineSlabs } from './render/EngineSlabs';
import { EngineWalls } from './render/EngineWalls';

type Props = {
  architecturalHouse: ArchitecturalHouse;
};

export function EngineHouse({ architecturalHouse }: Props) {
  const derived: DerivedHouse = useMemo(
    () => deriveHouse(architecturalHouse),
    [architecturalHouse]
  );
  const levelFootprintsById = useMemo(
    () => Object.fromEntries(architecturalHouse.levels.map((level) => [level.id, level.footprint.outer])),
    [architecturalHouse]
  );

  return (
    <>
      <EngineWalls
        walls={derived.walls}
        openings={derived.openings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        wallMaterialSpec={architecturalHouse.materials?.walls}
      />
      <EngineOpenings
        openings={derived.openings}
        wallThickness={architecturalHouse.wallThickness}
        windowsMaterialSpec={architecturalHouse.materials?.windows}
      />
      <EngineSlabs slabs={derived.slabs} />
      <EngineRoofs
        roofs={derived.roofs}
        roofRevision={derived.revisions.roofs}
        roofValidationEntries={[]}
        roofMaterialSpec={architecturalHouse.materials?.roof}
      />
      <EngineDebugHUD derived={derived} />
      <RoofPlaneVisualizer roofs={derived.roofs} />
      <DerivedGraphOverlay derived={derived} />
    </>
  );
}
