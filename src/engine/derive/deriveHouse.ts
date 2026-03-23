import type { ArchitecturalHouse, LevelSpec } from '../architecturalTypes';
import { validateStructure } from '../validation/validateStructure';
import { deriveExteriorAccesses } from './deriveExteriorAccesses';
import { deriveOpenings } from './deriveOpenings';
import { deriveRoofs } from './deriveRoofs';
import { deriveSlabs } from './deriveSlabs';
import { deriveWalls } from './deriveWalls';
import type { DerivedHouse } from './types/DerivedHouse';

let revisionCounter = 1;

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
  const slabsRev = revisionCounter++;

  const walls = deriveWalls(arch, { slabs });
  const wallsRev = revisionCounter++;

  // Stage 2
  const openings = deriveOpenings(arch, { slabs, walls });
  const openingsRev = revisionCounter++;

  // Stage 3
  const roofs = deriveRoofs(arch, { slabs, walls, openings });
  const roofsRev = revisionCounter++;

  const { parts: exteriorAccesses, cutouts: exteriorAccessCutouts } = deriveExteriorAccesses(arch, { walls });

  return {
    slabs,
    walls,
    roofs,
    openings,
    exteriorAccesses,
    exteriorAccessCutouts,
    revisions: {
      slabs: slabsRev,
      walls: wallsRev,
      roofs: roofsRev,
      openings: openingsRev,
    },
  };
}
