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
import { EngineCarports } from './render/EngineCarports';
import { EngineOpenings } from './render/EngineOpenings';
import { EngineRoofs } from './render/EngineRoofs';
import { EngineSlabs } from './render/EngineSlabs';
import { EngineSite } from './render/EngineSite';
import { EngineWalls } from './render/EngineWalls';
import { EngineRooms } from './render/EngineRooms';
import { getWallVisibleBaseY, getWallVisibleTopY, type DerivedWallSegment } from './deriveWalls';

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
    () => {
      const arch = architecturalHouse;
      console.log('ARCH PASSED INTO ENGINE:', arch);
      return deriveHouse(arch);
    },
    [architecturalHouse]
  );
  const siteElevation = architecturalHouse.site?.elevation ?? 0;
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
  const clippedAboveGradeWalls = useMemo(
    () =>
      aboveGradeWalls
        .map<DerivedWallSegment | null>((wall) => {
          const visibleTopY = getWallVisibleTopY(wall);
          const clippedBaseY = Math.max(getWallVisibleBaseY(wall), siteElevation);
          const clippedVisibleHeight = visibleTopY - clippedBaseY;

          if (clippedVisibleHeight <= 0) {
            return null;
          }

          return {
            ...wall,
            visibleBaseY: clippedBaseY,
            visibleHeight: clippedVisibleHeight,
          };
        })
        .filter((wall): wall is DerivedWallSegment => wall !== null),
    [aboveGradeWalls, siteElevation]
  );
  const belowGradeBandWalls = useMemo(
    () =>
      aboveGradeWalls
        .map<DerivedWallSegment | null>((wall) => {
          const visibleBaseY = getWallVisibleBaseY(wall);
          const visibleTopY = getWallVisibleTopY(wall);
          const belowGradeTopY = Math.min(visibleTopY, siteElevation);
          const belowGradeVisibleHeight = belowGradeTopY - visibleBaseY;

          if (belowGradeVisibleHeight <= 0) {
            return null;
          }

          return {
            ...wall,
            id: `${wall.id}-below-grade`,
            visibleBaseY,
            visibleHeight: belowGradeVisibleHeight,
          };
        })
        .filter((wall): wall is DerivedWallSegment => wall !== null),
    [aboveGradeWalls, siteElevation]
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
      <EngineSite
        site={architecturalHouse.site}
        cutouts={derived.exteriorAccessCutouts.map((cutout) => cutout.polygon)}
        visible={showEnvelope}
      />
      <EngineWalls
        walls={clippedAboveGradeWalls}
        openings={aboveGradeOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={architecturalHouse.materials?.walls}
        cacheKey="above-grade"
      />
      <EngineWalls
        walls={belowGradeBandWalls}
        openings={[]}
        wallRevision={derived.revisions.walls}
        openingsRevision={0}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={FOUNDATION_WALL_MATERIAL}
        cacheKey="below-grade-band"
      />
      <EngineWalls
        walls={basementWalls}
        openings={basementOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showEnvelope}
        wallMaterialSpec={FOUNDATION_WALL_MATERIAL}
        cacheKey="basement"
      />
      <EngineRooms rooms={architecturalHouse.rooms ?? []} levels={architecturalHouse.levels} />
      <EngineOpenings
        openings={derived.openings}
        wallThickness={architecturalHouse.wallThickness}
        visible={showEnvelope}
        windowsMaterialSpec={architecturalHouse.materials?.windows}
      />
      <EngineExteriorAccesses
        parts={derived.exteriorAccesses}
        visible={showEnvelope}
        wallMaterialSpec={architecturalHouse.materials?.walls}
      />
      <EngineSlabs slabs={derived.slabs} />
      <EngineRoofs
        roofs={derived.roofs}
        roofRevision={derived.revisions.roofs}
        roofValidationEntries={[]}
        visible={showEnvelope}
        roofMaterialSpec={architecturalHouse.materials?.roof}
      />
      <EngineCarports
        carports={derived.carports}
        columnColor={architecturalHouse.materials?.windows?.frameColor}
        visible={showEnvelope}
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
