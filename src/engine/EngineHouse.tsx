import { useMemo } from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import { deriveHouse } from './derive/deriveHouse';
import { EdgeVisualizer } from './debug/EdgeVisualizer';
import { EngineDebugHUD } from './debug/EngineDebugHUD';
import { DerivedGraphOverlay } from './debug/DerivedGraphOverlay';
import { OpeningAnchorDebug } from './debug/OpeningAnchorDebug';
import { RoofPlaneVisualizer } from './debug/RoofPlaneVisualizer';
import { debugFlags } from './debug/debugFlags';
import type { DerivedHouse } from './derive/types/DerivedHouse';
import { EngineExteriorAccesses } from './render/EngineExteriorAccesses';
import { EngineGroundPlane } from './render/EngineGroundPlane';
import { EngineOpenings } from './render/EngineOpenings';
import { EngineRoofs } from './render/EngineRoofs';
import { EngineSlabs } from './render/EngineSlabs';
import { EngineSite } from './render/EngineSite';
import { EngineWalls } from './render/EngineWalls';

type Props = {
  architecturalHouse: ArchitecturalHouse;
  showEnvelope?: boolean;
};

const FOUNDATION_WALL_MATERIAL = {
  color: '#c8c8c8',
  exteriorColor: '#c8c8c8',
  interiorColor: '#c8c8c8',
  edgeColor: '#c8c8c8',
} as const;

export function EngineHouse({ architecturalHouse, showEnvelope = true }: Props) {
  const derived: DerivedHouse = useMemo(
    () => deriveHouse(architecturalHouse),
    [architecturalHouse]
  );
  const levelFootprintsById = useMemo(
    () => Object.fromEntries(architecturalHouse.levels.map((level) => [level.id, level.footprint.outer])),
    [architecturalHouse]
  );
  const basementLevelIds = useMemo(() => new Set(['basement']), []);
  const basementWalls = useMemo(
    () => derived.walls.filter((wall) => basementLevelIds.has(wall.levelId)),
    [basementLevelIds, derived.walls]
  );
  const aboveGradeWalls = useMemo(
    () => derived.walls.filter((wall) => !basementLevelIds.has(wall.levelId)),
    [basementLevelIds, derived.walls]
  );
  const basementOpenings = useMemo(
    () => derived.openings.filter((opening) => architecturalHouse.levels[opening.levelIndex]?.id === 'basement'),
    [architecturalHouse.levels, derived.openings]
  );
  const aboveGradeOpenings = useMemo(
    () => derived.openings.filter((opening) => architecturalHouse.levels[opening.levelIndex]?.id !== 'basement'),
    [architecturalHouse.levels, derived.openings]
  );

  return (
    <>
      <EngineSite site={architecturalHouse.site} visible={showEnvelope} />
      <EngineWalls
        walls={aboveGradeWalls}
        openings={aboveGradeOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={architecturalHouse.materials?.walls}
        cacheKey="above-grade"
      />
      <EngineWalls
        walls={basementWalls}
        openings={basementOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={{ color: '#9b9b9b', exteriorColor: '#9b9b9b', interiorColor: '#9b9b9b', edgeColor: '#9b9b9b' }}
        cacheKey="basement"
      />
      <EngineWalls
        walls={basementWalls}
        openings={basementOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={{ color: '#9b9b9b', exteriorColor: '#9b9b9b', interiorColor: '#9b9b9b', edgeColor: '#9b9b9b' }}
      />
      <EngineOpenings
        openings={derived.openings}
        wallThickness={architecturalHouse.wallThickness}
        visible={showEnvelope}
        windowsMaterialSpec={architecturalHouse.materials?.windows}
      />
      <EngineExteriorAccesses parts={derived.exteriorAccesses} visible={showEnvelope} />
      <EngineSlabs slabs={derived.slabs} />
      <EngineRoofs
        roofs={derived.roofs}
        roofRevision={derived.revisions.roofs}
        roofValidationEntries={[]}
        visible={showEnvelope}
        roofMaterialSpec={architecturalHouse.materials?.roof}
      />
      {debugFlags.enabled && (
        <>
          <EdgeVisualizer walls={derived.walls} />
          <OpeningAnchorDebug openings={derived.openings} />
        </>
      )}
      <EngineDebugHUD derived={derived} />
      <RoofPlaneVisualizer roofs={derived.roofs} />
      <DerivedGraphOverlay derived={derived} />
    </>
  );
}
