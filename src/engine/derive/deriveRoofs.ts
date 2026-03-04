import type { ArchitecturalHouse } from '../architecturalTypes';
import { offsetPolygonInward } from '../geom2d/offsetPolygon';
import type { XZ } from '../types';
import type { DerivedRoof } from './types/DerivedRoof';

function dedupeConsecutivePoints(points: XZ[]): XZ[] {
  if (points.length < 2) return points;

  const deduped: XZ[] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev.x - point.x) > 1e-9 || Math.abs(prev.z - point.z) > 1e-9) {
      deduped.push(point);
    }
  }

  return deduped;
}

function ensureClosed(points: XZ[]): XZ[] {
  const deduped = dedupeConsecutivePoints(points);
  if (deduped.length < 3) return deduped;

  const first = deduped[0];
  const last = deduped[deduped.length - 1];
  if (first.x === last.x && first.z === last.z) return deduped;

  return [...deduped, first];
}

export function deriveRoofs(arch: ArchitecturalHouse): DerivedRoof[] {
  const { roofs = [] } = arch;

  return roofs.flatMap((roof) => {
    const baseLevel = arch.levels.find((level) => level.id === roof.baseLevelId);
    if (!baseLevel) return [];

    const footprintOuter = ensureClosed(baseLevel.footprint.outer);
    const footprintHoles = (baseLevel.footprint.holes ?? []).map((hole) => ensureClosed(hole));

    let roofPolygonOuter = footprintOuter;
    const overhang = 'overhang' in roof ? roof.overhang : undefined;
    if (overhang && overhang !== 0) {
      roofPolygonOuter = ensureClosed(offsetPolygonInward(roofPolygonOuter, -overhang));
    }

    return {
      id: roof.id,
      kind: roof.type,
      baseLevelId: roof.baseLevelId,
      baseLevel: {
        id: baseLevel.id,
        elevation: baseLevel.elevation,
        height: baseLevel.height,
      },
      footprintOuter,
      footprintHoles,
      roofPolygonOuter,
      roofPolygonHoles: footprintHoles,
      spec: roof,
    };
  });
}
