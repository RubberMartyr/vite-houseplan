import type { ArchitecturalHouse } from '../architecturalTypes';
import { EngineWallShells } from './EngineWallShells';

type EngineWallsProps = {
  arch: ArchitecturalHouse;
};

export function EngineWalls({ arch }: EngineWallsProps) {
  return <EngineWallShells arch={arch} />;
}
