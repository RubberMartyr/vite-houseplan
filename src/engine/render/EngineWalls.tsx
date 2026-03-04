import { useMemo } from 'react';
import type { DerivedWallSegment } from '../deriveWalls';
import { buildWallsFromDerivedSegments } from '../buildWallsFromDerivedSegments';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  visible?: boolean;
};

export function EngineWalls({ walls, visible = true }: EngineWallsProps) {
  const builtWalls = useMemo(() => {
    if (!visible) {
      return [];
    }

    return buildWallsFromDerivedSegments(walls);
  }, [walls, visible]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {builtWalls.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry}>
          <meshStandardMaterial />
        </mesh>
      ))}
    </>
  );
}
