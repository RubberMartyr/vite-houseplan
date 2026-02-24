import { useMemo } from 'react';
import type { ArchitecturalHouse } from '../engine/architecturalTypes';
import { deriveWallShellsFromLevels } from '../engine/deriveWallShells';

type EngineWallShellsDebugProps = {
  arch: ArchitecturalHouse;
  visible?: boolean;
};

export function EngineWallShellsDebug({
  arch,
  visible = true,
}: EngineWallShellsDebugProps) {
  const shells = useMemo(() => {
    if (!visible) {
      return [];
    }

    return deriveWallShellsFromLevels(arch);
  }, [arch, visible]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {shells.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry}>
          <meshStandardMaterial wireframe />
        </mesh>
      ))}
    </>
  );
}
