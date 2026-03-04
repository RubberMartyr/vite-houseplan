import { useMemo } from 'react';
import type { ArchitecturalHouse } from './architecturalTypes';
import type { MultiPlaneRoofSpec } from './types';
import { deriveHouse } from './derive/deriveHouse';
import { EngineFlatRoofs } from './render/EngineFlatRoofs';
import { EngineGableRoofs } from './render/EngineGableRoofs';
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
      <EngineFlatRoofs arch={architecturalHouse} roofs={derived.roofs as MultiPlaneRoofSpec[]} roofRevision={0} />
      <EngineGableRoofs arch={architecturalHouse} roofs={derived.roofs as MultiPlaneRoofSpec[]} roofRevision={0} />
    </>
  );
}
