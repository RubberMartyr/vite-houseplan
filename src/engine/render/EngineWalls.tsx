import { useMemo } from 'react';
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

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  openings: DerivedOpening[];
  wallRevision: number;
  openingsRevision: number;
  visible?: boolean;
};

const getGeometry = createGeometryCache<BuiltWall[]>();

export function EngineWalls({
  walls,
  openings,
  wallRevision,
  openingsRevision,
  visible = true,
}: EngineWallsProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);

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

  if (!visible) {
    return null;
  }

  return (
    <>
      {builtWalls.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} userData={{ debugType: 'structure' }}>
          <meshStandardMaterial wireframe={debugWireframe} />
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
