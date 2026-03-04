import { useMemo } from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import { deriveHouse } from './derive/deriveHouse';
import { EngineRoofs } from './render/EngineRoofs';
import { EngineSlabs } from './render/EngineSlabs';
import { EngineWalls } from './render/EngineWalls';

type Props = {
  architecturalHouse: ArchitecturalHouse;
};

export function EngineHouse({ architecturalHouse }: Props) {
  const derived = useMemo(() => deriveHouse(architecturalHouse), [architecturalHouse]);

  return (
    <>
      <EngineWalls walls={derived.walls} />
      <EngineSlabs slabs={derived.slabs} />
      <EngineRoofs arch={architecturalHouse} roofs={derived.roofs} roofRevision={0} roofValidationEntries={[]} />
    </>
  );
}
