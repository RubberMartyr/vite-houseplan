import type { ArchitecturalHouse, Footprint } from '../types';
import { offsetPolygonInward } from '../geom2d/offsetPolygon';

export type DerivedSlabKind = 'floor' | 'roof-bearing';

export interface DerivedSlab {
  id: string;
  kind: DerivedSlabKind;
  levelId: string;
  levelIndex: number;
  elevationTop: number;
  elevationBottom: number;
  footprint: Footprint;
  inset: number;
}

function buildSlabFootprint(level: ArchitecturalHouse['levels'][number], inset: number): Footprint {
  const slabPolygon = offsetPolygonInward(level.footprint.outer, inset);

  return {
    outer: slabPolygon,
    holes: level.footprint.holes,
  };
}

export function deriveSlabs(house: ArchitecturalHouse): DerivedSlab[] {
  const roofBearingLevelIds = new Set((house.roofs ?? []).map((roof) => roof.baseLevelId));

  return house.levels.flatMap((level, index) => {
    const requestedInset = level.slab?.inset ?? 0;
    const defaultInset = house.wallThickness / 2;
    const effectiveInset = Math.max(requestedInset, defaultInset);
    const footprint = buildSlabFootprint(level, effectiveInset);

    const floorSlab: DerivedSlab = {
      id: `${level.id}-floor-slab`,
      kind: 'floor',
      levelId: level.id,
      levelIndex: index,
      elevationTop: level.elevation,
      elevationBottom: level.elevation - level.slab.thickness,
      footprint,
      inset: effectiveInset,
    };

    if (!roofBearingLevelIds.has(level.id)) {
      return [floorSlab];
    }

    const roofBearingSlab: DerivedSlab = {
      id: `${level.id}-roof-bearing-slab`,
      kind: 'roof-bearing',
      levelId: level.id,
      levelIndex: index,
      elevationTop: level.elevation + level.height + level.slab.thickness,
      elevationBottom: level.elevation + level.height,
      footprint,
      inset: effectiveInset,
    };

    return [floorSlab, roofBearingSlab];
  });
}
