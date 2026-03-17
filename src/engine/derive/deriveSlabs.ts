import type { ArchitecturalHouse, Footprint } from '../types';
import { offsetPolygonInward } from '../geom2d/offsetPolygon';

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
    const requestedInset = level.slab?.inset ?? 0;
    const defaultInset = house.wallThickness / 2;
    const effectiveInset = Math.max(requestedInset, defaultInset);
    const slabPolygon = offsetPolygonInward(level.footprint.outer, effectiveInset);

    return {
      levelIndex: index,
      elevationTop: top,
      elevationBottom: bottom,
      footprint: {
        outer: slabPolygon,
        holes: level.footprint.holes,
      },
      inset: effectiveInset,
    };
  });
}
