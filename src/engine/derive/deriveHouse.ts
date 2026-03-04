import type { ArchitecturalHouse, LevelSpec } from '../architecturalTypes';
import { validateStructure } from '../validation/validateStructure';
import { deriveOpenings } from './deriveOpenings';
import { deriveRoofs } from './deriveRoofs';
import { deriveSlabs } from './deriveSlabs';
import { deriveWalls } from './deriveWalls';
import type { DerivedHouse } from './types/DerivedHouse';

function hashRevision(input: unknown): number {
  const value = JSON.stringify(input);
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash;
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
  const slabRevision = hashRevision({
    levels: arch.levels,
    slabs,
  });

  const walls = deriveWalls(arch, { slabs });
  const wallRevision = hashRevision({
    slabRevision,
    wallThickness: arch.wallThickness,
    walls,
  });

  // Stage 2
  const openings = deriveOpenings(arch, { slabs, walls });
  const openingRevision = hashRevision({
    wallRevision,
    openingsSpec: arch.openings,
    openings,
  });

  // Stage 3
  const roofs = deriveRoofs(arch, { slabs, walls, openings });
  const roofRevision = hashRevision({
    openingRevision,
    roofsSpec: arch.roofs,
    roofs,
  });

  return {
    slabs,
    walls,
    roofs,
    openings,
    revisions: {
      slabs: slabRevision,
      walls: wallRevision,
      openings: openingRevision,
      roofs: roofRevision,
    },
  };
}
