import * as THREE from 'three';
import polygonClipping from 'polygon-clipping';
import type { ArchitecturalHouse } from '../architecturalTypes';
import type { XZ } from '../types';
import { offsetPolygonInward } from '../geom2d/offsetPolygon';
import type { DerivedRoof } from './types/DerivedRoof';
import type { DerivedSlab } from './deriveSlabs';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';

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

function toPoly(points: XZ[]) {
  const ring = points[0] === points[points.length - 1] ? points : [...points, points[0]];
  return [ring.map((p) => [p.x, p.z])];
}

function triangulateRoofPolygon(
  polygon: XZ[],
  y: number
): Array<{ a: [number, number, number]; b: [number, number, number]; c: [number, number, number] }> {
  const closed = ensureClosed(polygon);
  if (closed.length < 4) return [];

  const open = closed.slice(0, -1);
  const contour = open.map((point) => new THREE.Vector2(point.x, point.z));
  const indices = THREE.ShapeUtils.triangulateShape(contour, []);

  return indices.map(([ia, ib, ic]) => ({
    a: [open[ia].x, y, open[ia].z],
    b: [open[ib].x, y, open[ib].z],
    c: [open[ic].x, y, open[ic].z],
  }));
}

type DeriveRoofsContext = {
  slabs: DerivedSlab[];
  walls: DerivedWallSegment[];
  openings: DerivedOpeningRect[];
};

export function deriveRoofs(arch: ArchitecturalHouse, _context: DeriveRoofsContext): DerivedRoof[] {
  const { roofs = [] } = arch;

  const footprintByLevelId = new Map<string, XZ[]>();
  for (const level of arch.levels) {
    footprintByLevelId.set(level.id, ensureClosed(level.footprint.outer));
  }

  return roofs.flatMap((roof) => {
    const baseLevel = arch.levels.find((level) => level.id === roof.baseLevelId);
    if (!baseLevel) return [];

    let roofPolygonOuter = ensureClosed(baseLevel.footprint.outer);
    const overhang = 'overhang' in roof ? roof.overhang : undefined;
    if (overhang && overhang !== 0) {
      roofPolygonOuter = ensureClosed(offsetPolygonInward(roofPolygonOuter, -overhang));
    }

    const y = baseLevel.elevation + baseLevel.height;
    let triangles = triangulateRoofPolygon(roofPolygonOuter, y);

    if (roof.type === 'flat' && roof.subtractAboveLevelId) {
      const basePoly = toPoly(roofPolygonOuter);
      const aboveFootprint = footprintByLevelId.get(roof.subtractAboveLevelId);

      if (aboveFootprint) {
        const diff = polygonClipping.difference(basePoly as any, toPoly(aboveFootprint) as any);
        triangles = (diff as any[]).flatMap((polygon) => {
          const outerRing = (polygon[0] as number[][]).map(([x, z]) => ({ x, z }));
          return triangulateRoofPolygon(outerRing, y);
        });
      }
    }

    const type: DerivedRoof['type'] = roof.type === 'flat' ? 'flat' : 'gable';

    return {
      id: roof.id,
      type,
      triangles,
      kind: roof.type,
      baseLevelId: roof.baseLevelId,
      baseLevel: {
        id: baseLevel.id,
        elevation: baseLevel.elevation,
        height: baseLevel.height,
      },
      footprintOuter: ensureClosed(baseLevel.footprint.outer),
      footprintHoles: (baseLevel.footprint.holes ?? []).map((hole) => ensureClosed(hole)),
      roofPolygonOuter,
      roofPolygonHoles: (baseLevel.footprint.holes ?? []).map((hole) => ensureClosed(hole)),
      spec: roof,
    };
  });
}
