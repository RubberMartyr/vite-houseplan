import type { ArchitecturalHouse, LevelSpec } from '../architecturalTypes';
import { validateStructure } from '../validation/validateStructure';
import { deriveOpenings } from './deriveOpenings';
import { deriveRoofs } from './deriveRoofs';
import { deriveSlabs } from './deriveSlabs';
import { deriveWalls } from './deriveWalls';

export interface DerivedHouse {
  slabs: ReturnType<typeof deriveSlabs>;
  walls: ReturnType<typeof deriveWalls>;
  roofs: ReturnType<typeof deriveRoofs>;
  openings: ReturnType<typeof deriveOpenings>;
}

export function deriveHouse(arch: ArchitecturalHouse): DerivedHouse {
  // Stage 0
  validateStructure(
    arch,
    {
      getLevels: (house) => house.levels,
      getLevelElevation: (level) => (level as LevelSpec).elevation,
      getLevelHeight: (level) => (level as LevelSpec).height,
      getSlabThickness: (level) => (level as LevelSpec).slab?.thickness ?? null,
      elevationConvention: 'TOP_OF_SLAB',
      allowGroundSupport: true,
    },
    { mode: 'throw' }
  );

  // Stage 1
  const slabs = deriveSlabs(arch);
  const walls = deriveWalls(arch, slabs);

  // Stage 2
  const openings = deriveOpenings(arch);

  // Stage 3
  const roofs = deriveRoofs(arch, walls);

  return {
    slabs,
    walls,
    roofs,
    openings,
  };
}
