import { useEffect, useMemo } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../architecturalTypes';
import { getWallVisibleHeight, type DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { BuiltWall } from '../buildWallsFromDerivedSegments';
import { extrudeWallSegment } from '../extrudeWallSegment';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/geometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { groupOpeningsByWall } from '../openings/groupOpeningsByWall';
import { splitWallByOpenings } from '../openings/splitWallByOpenings';
import { buildWallPieceGeometry } from '../geometry/buildWallPieceGeometry';
import { createWallMaterial } from '../materials/materialResolver';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import { mergeExteriorWallsForRendering } from './mergeExteriorWallsForRendering';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  openings: DerivedOpening[];
  wallRevision: number;
  openingsRevision: number;
  levelFootprintsById?: Record<string, Vec2[]>;
  visible?: boolean;
  wallMaterialSpec?: ArchitecturalMaterials['walls'];
};

const getGeometry = createGeometryCache<BuiltWall[]>();

export function EngineWalls({
  walls,
  openings,
  wallRevision,
  openingsRevision,
  levelFootprintsById,
  visible = true,
  wallMaterialSpec,
}: EngineWallsProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const wallMaterial = useMemo(() => createWallMaterial(wallMaterialSpec), [wallMaterialSpec]);

  useEffect(() => {
    if ('wireframe' in wallMaterial) {
      (wallMaterial as { wireframe?: boolean }).wireframe = debugWireframe;
    }
  }, [debugWireframe, wallMaterial]);

  const builtWalls = useMemo(() => {
    if (!visible) {
      return [];
    }

    const revision = wallRevision * 1_000_000 + openingsRevision;

    return getGeometry(revision, () => {
      const { walls: visibleWalls, openings: visibleOpenings } = mergeExteriorWallsForRendering(walls, openings);
      const openingsByWall = groupOpeningsByWall(visibleWalls, visibleOpenings);

      return visibleWalls.flatMap((wall) => {
        const openingsOnWall = openingsByWall.get(wall.id) ?? [];
        const footprintOuter = levelFootprintsById?.[wall.levelId];

        if (!openingsOnWall.length) {
          return [
            {
              id: wall.id,
              geometry: extrudeWallSegment(wall, wallMaterialSpec?.scale ?? 0.6, footprintOuter),
            },
          ];
        }

        const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
        const pieces = splitWallByOpenings(
          wallLength,
          getWallVisibleHeight(wall),
          openingsOnWall,
          wall
        );

        return pieces.map((piece, pieceIndex) => ({
          id: `${wall.id}-piece-${pieceIndex}`,
          geometry: buildWallPieceGeometry(wall, piece, wallMaterialSpec?.scale ?? 0.6, footprintOuter),
        }));
      });
    });
  }, [walls, openings, wallRevision, openingsRevision, levelFootprintsById, visible, wallMaterialSpec?.scale]);

  const mergedGeometry = useMemo(() => {
    if (!builtWalls.length) {
      return null;
    }

    return mergeGeometries(
      builtWalls.map(({ geometry }) => geometry),
      false
    );
  }, [builtWalls]);

  if (!visible) {
    return null;
  }

  if (!mergedGeometry) {
    return null;
  }

  return (
    <mesh
      geometry={mergedGeometry}
      material={wallMaterial}
      castShadow
      receiveShadow
      userData={{ debugType: 'structure' }}
    >
      <DebugWireframe />
    </mesh>
  );
}
