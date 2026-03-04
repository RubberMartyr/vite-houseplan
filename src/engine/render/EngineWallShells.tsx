import { useMemo } from 'react';
import type { ArchitecturalHouse } from '../architecturalTypes';
import { deriveWallShellsFromLevels } from '../deriveWallShells';

type EngineWallShellsProps = {
  arch: ArchitecturalHouse;
  visible?: boolean;
};

export function EngineWallShells({
  arch,
  visible = true,
}: EngineWallShellsProps) {
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
