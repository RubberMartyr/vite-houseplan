import { useMemo } from 'react';
import type { DerivedWallSegment } from '../engine/deriveWalls';
import { buildWallsFromDerivedSegments } from '../engine/buildWallsFromDerivedSegments';

type EngineWallsDebugProps = {
  segments: DerivedWallSegment[];
  visible?: boolean;
};

export function EngineWallsDebug({ segments, visible = true }: EngineWallsDebugProps) {
  const builtWalls = useMemo(() => {
    if (!visible) {
      return [];
    }

    return buildWallsFromDerivedSegments(segments);
  }, [segments, visible]);

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
