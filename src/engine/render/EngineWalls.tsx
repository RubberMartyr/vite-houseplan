import { useMemo } from 'react';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { BuiltWall } from '../buildWallsFromDerivedSegments';
import { extrudeWallSegment } from '../extrudeWallSegment';
import { splitWallByOpenings } from '../geometry/buildWallSegmentsWithOpenings';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/geometryCache';
import { useDebugUIState } from '../debug/debugUIState';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  openings: DerivedOpeningRect[];
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
      const levelIndexById = new Map<string, number>();

      walls.forEach((wall) => {
        if (levelIndexById.has(wall.levelId)) {
          return;
        }

        levelIndexById.set(wall.levelId, levelIndexById.size);
      });

      return walls.flatMap((wall) => {
        const edgeIndex = Number.parseInt(wall.id.split('-').at(-1) ?? '', 10);
        const levelIndex = levelIndexById.get(wall.levelId);

        if (!Number.isFinite(edgeIndex) || levelIndex == null) {
          return [
            {
              id: wall.id,
              geometry: extrudeWallSegment(wall),
            },
          ];
        }

        const openingsOnThisWall = openings.filter(
          (opening) => opening.levelIndex === levelIndex && opening.edgeIndex === edgeIndex
        );

        if (!openingsOnThisWall.length) {
          return [
            {
              id: wall.id,
              geometry: extrudeWallSegment(wall),
            },
          ];
        }

        const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
        const pieces = splitWallByOpenings(wallLength, wall.height, openingsOnThisWall);

        return pieces
          .filter((piece) => piece.endU > piece.startU && piece.top > piece.bottom)
          .map((piece, pieceIndex) => {
            const startT = piece.startU / wallLength;
            const endT = piece.endU / wallLength;

            const pieceSegment: DerivedWallSegment = {
              ...wall,
              id: `${wall.id}-piece-${pieceIndex}`,
              start: {
                x: wall.start.x + (wall.end.x - wall.start.x) * startT,
                y: wall.start.y + piece.bottom,
                z: wall.start.z + (wall.end.z - wall.start.z) * startT,
              },
              end: {
                x: wall.start.x + (wall.end.x - wall.start.x) * endT,
                y: wall.start.y + piece.bottom,
                z: wall.start.z + (wall.end.z - wall.start.z) * endT,
              },
              height: piece.top - piece.bottom,
            };

            return {
              id: pieceSegment.id,
              geometry: extrudeWallSegment(pieceSegment),
            };
          });
      });
    });
  }, [walls, openings, wallRevision, openingsRevision, visible]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {builtWalls.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry}>
          <meshStandardMaterial wireframe={debugWireframe} />
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
