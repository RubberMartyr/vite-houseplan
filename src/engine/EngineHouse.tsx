import { Suspense, lazy, useMemo } from 'react';
import type { ArchitecturalHouse, RoomSpec } from './architecturalTypes';
import { deriveHouse } from './derive/deriveHouse';
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


const EngineDebugLayer = lazy(() =>
  import('./debug/EngineDebugLayer').then((module) => ({
    default: module.EngineDebugLayer,
  }))
);
type Props = {
  house: ArchitecturalHouse;
  showWalls?: boolean;
  showRoof?: boolean;
  showSlabs?: boolean;
  showGlass?: boolean;
  showRooms?: boolean;
  showDebug?: boolean;
  selectedRoomId?: string | null;
  hoveredRoomId?: string | null;
  onRoomSelect?: (room: RoomSpec) => void;
  onRoomHover?: (roomId: string | null) => void;
};

const FOUNDATION_WALL_MATERIAL = {
  color: '#c8c8c8',
  exteriorColor: '#c8c8c8',
  interiorColor: '#c8c8c8',
  edgeColor: '#c8c8c8',
} as const;

export function EngineHouse({
  house,
  showWalls = true,
  showRoof = true,
  showSlabs = true,
  showGlass = true,
  showRooms = false,
  showDebug = false,
  selectedRoomId = null,
  hoveredRoomId = null,
  onRoomSelect,
  onRoomHover,
}: Props) {
  const derived: DerivedHouse = useMemo(
    () => {
      const arch = house;
      return deriveHouse(arch);
    },
    [house]
  );
  const siteElevation = house.site?.elevation ?? 0;
  const levelFootprintsById = useMemo(
    () => Object.fromEntries(house.levels.map((level) => [level.id, level.footprint.outer])),
    [house]
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
    () => derived.openings.filter((opening) => house.levels[opening.levelIndex]?.id === 'basement'),
    [house.levels, derived.openings]
  );
  const aboveGradeOpenings = useMemo(
    () => derived.openings.filter((opening) => house.levels[opening.levelIndex]?.id !== 'basement'),
    [house.levels, derived.openings]
  );

  return (
    <>
      <EngineSite
        site={house.site}
        cutouts={derived.exteriorAccessCutouts.map((cutout) => cutout.polygon)}
        visible={showWalls}
      />
      <EngineWalls
        walls={clippedAboveGradeWalls}
        openings={aboveGradeOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showWalls}
        wallMaterialSpec={house.materials?.walls}
        cacheKey="above-grade"
      />
      <EngineWalls
        walls={belowGradeBandWalls}
        openings={[]}
        wallRevision={derived.revisions.walls}
        openingsRevision={0}
        levelFootprintsById={levelFootprintsById}
        visible={showWalls}
        wallMaterialSpec={FOUNDATION_WALL_MATERIAL}
        cacheKey="below-grade-band"
      />
      <EngineWalls
        walls={basementWalls}
        openings={basementOpenings}
        wallRevision={derived.revisions.walls}
        openingsRevision={derived.revisions.openings}
        levelFootprintsById={levelFootprintsById}
        visible={showWalls}
        wallMaterialSpec={FOUNDATION_WALL_MATERIAL}
        cacheKey="basement"
      />
      {showRooms && (
        <EngineRooms
          rooms={house.rooms ?? []}
          levels={house.levels}
          selectedRoomId={selectedRoomId}
          hoveredRoomId={hoveredRoomId}
          onRoomSelect={onRoomSelect}
          onRoomHover={onRoomHover}
        />
      )}
      <EngineOpenings
        openings={derived.openings}
        wallThickness={house.wallThickness}
        visible={showGlass}
        windowsMaterialSpec={house.materials?.windows}
      />
      <EngineExteriorAccesses
        parts={derived.exteriorAccesses}
        visible={showWalls}
        wallMaterialSpec={house.materials?.walls}
      />
      <EngineSlabs slabs={derived.slabs} slabRevision={derived.revisions.slabs} visible={showSlabs} />
      <EngineRoofs
        roofs={derived.roofs}
        roofRevision={derived.revisions.roofs}
        roofValidationEntries={[]}
        visible={showRoof}
        roofMaterialSpec={house.materials?.roof}
      />
      <EngineCarports
        carports={derived.carports}
        columnColor={house.materials?.windows?.frameColor}
        visible={showWalls}
      />
      {showDebug && (
        <Suspense fallback={null}>
          <EngineDebugLayer derived={derived} />
        </Suspense>
      )}
    </>
  );
}
