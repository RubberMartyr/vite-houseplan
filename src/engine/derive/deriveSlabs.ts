import type { ArchitecturalHouse, Footprint } from '../types';

export interface DerivedSlab {
  levelIndex: number;
  elevationTop: number;
  elevationBottom: number;
  footprint: Footprint;
  inset: number;
}

export function deriveSlabs(house: ArchitecturalHouse): DerivedSlab[] {
  return house.levels.map((level, index) => {
    const top = level.elevation;
    const bottom = level.elevation - level.slab.thickness;

    return {
      levelIndex: index,
      elevationTop: top,
      elevationBottom: bottom,
      footprint: level.footprint,
      inset: level.slab.inset,
    };
  });
}
