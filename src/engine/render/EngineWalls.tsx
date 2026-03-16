import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { BuiltWall } from '../buildWallsFromDerivedSegments';
import { extrudeWallSegment } from '../extrudeWallSegment';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/geometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { groupOpeningsByWall } from '../openings/groupOpeningsByWall';
import { splitWallByOpenings } from '../openings/splitWallByOpenings';
import { buildWallPieceGeometry } from '../geometry/buildWallPieceGeometry';
import { resolveMaterial, type MaterialSpec } from '../materials/resolveMaterial';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  openings: DerivedOpening[];
  wallRevision: number;
  openingsRevision: number;
  visible?: boolean;
  wallMaterialSpec?: MaterialSpec;
};

const getGeometry = createGeometryCache<BuiltWall[]>();

export function EngineWalls({
  walls,
  openings,
  wallRevision,
  openingsRevision,
  visible = true,
  wallMaterialSpec,
}: EngineWallsProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const wallMaterial = useMemo(
    () => resolveMaterial(wallMaterialSpec, { side: THREE.DoubleSide }),
    [wallMaterialSpec]
  );

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
      const openingsByWall = groupOpeningsByWall(walls, openings);

      return walls.flatMap((wall) => {
        const openingsOnWall = openingsByWall.get(wall.id) ?? [];

        if (!openingsOnWall.length) {
          return [
            {
              id: wall.id,
              geometry: extrudeWallSegment(wall),
            },
          ];
        }

        const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
        const pieces = splitWallByOpenings(wallLength, wall.height, openingsOnWall);

        return pieces.map((piece, pieceIndex) => ({
          id: `${wall.id}-piece-${pieceIndex}`,
          geometry: buildWallPieceGeometry(wall, piece),
        }));
      });
    });
  }, [walls, openings, wallRevision, openingsRevision, visible]);

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
    <mesh geometry={mergedGeometry} material={wallMaterial} userData={{ debugType: 'structure' }}>
      <DebugWireframe />
    </mesh>
  );
}
