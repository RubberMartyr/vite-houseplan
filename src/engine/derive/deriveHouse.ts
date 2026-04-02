import type { ArchitecturalHouse, LevelSpec, SiteSpec } from '../architecturalTypes';
import { validateStructure } from '../validation/validateStructure';
import { deriveExteriorAccesses } from './deriveExteriorAccesses';
import { deriveOpenings } from './deriveOpenings';
import { deriveRoofs } from './deriveRoofs';
import { deriveSlabs } from './deriveSlabs';
import { deriveAuxiliaryStructures } from './deriveAuxiliaryStructures';
import { deriveRooms } from './deriveRooms';
import { deriveWalls } from './deriveWalls';
import { getStructuralWallHeight } from './getStructuralWallHeight';
import type { DerivedHouse } from './types/DerivedHouse';
import { normalizeArchitecturalHouse } from '../normalizeArchitecturalHouse';

let revisionCounter = 1;

export function deriveHouse(arch: ArchitecturalHouse, options?: { site?: SiteSpec }): DerivedHouse {
  const normalizedArch = normalizeArchitecturalHouse(arch);

  // Stage 0
  validateStructure(
    normalizedArch,
    {
      getLevels: (house) => house.levels,
      getLevelElevation: (level) => (level as LevelSpec).elevation,
      getLevelHeight: (_level, index) => getStructuralWallHeight(normalizedArch.levels, index),
      getSlabThickness: (level) => (level as LevelSpec).slab?.thickness ?? null,
      elevationConvention: 'TOP_OF_SLAB',
      allowGroundSupport: true,
    },
    { mode: 'throw' }
  );

  // Stage 1
  const slabs = deriveSlabs(normalizedArch);
  const slabsRev = revisionCounter++;

  const walls = deriveWalls(normalizedArch, { slabs });
  const wallsRev = revisionCounter++;

  // Stage 2
  const openings = deriveOpenings(normalizedArch, { slabs, walls });
  const openingsRev = revisionCounter++;
  const rooms = deriveRooms(normalizedArch);

  // Stage 3
  const roofs = deriveRoofs(normalizedArch, { slabs, walls, openings });
  const roofsRev = revisionCounter++;
  const carports = deriveAuxiliaryStructures(normalizedArch, { roofs, site: options?.site });
  const carportsRev = revisionCounter++;

  const { parts: exteriorAccesses, cutouts: exteriorAccessCutouts } = deriveExteriorAccesses(normalizedArch, { walls });

  return {
    slabs,
    walls,
    roofs,
    carports,
    openings,
    rooms,
    exteriorAccesses,
    exteriorAccessCutouts,
    revisions: {
      slabs: slabsRev,
      walls: wallsRev,
      roofs: roofsRev,
      openings: openingsRev,
      carports: carportsRev,
    },
  };
}
