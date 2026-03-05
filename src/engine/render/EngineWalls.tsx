import { useMemo } from 'react';
import type { DerivedWallSegment } from '../deriveWalls';
import { buildWallsFromDerivedSegments } from '../buildWallsFromDerivedSegments';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/geometryCache';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  wallRevision: number;
  visible?: boolean;
};

const getGeometry = createGeometryCache<ReturnType<typeof buildWallsFromDerivedSegments>>();

export function EngineWalls({ walls, wallRevision, visible = true }: EngineWallsProps) {
  const builtWalls = useMemo(() => {
    if (!visible) {
      return [];
    }

    return getGeometry(wallRevision, () => buildWallsFromDerivedSegments(walls));
  }, [walls, wallRevision, visible]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {builtWalls.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry}>
          <meshStandardMaterial />
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
