import { frontOpeningRectsFirst, frontOpeningRectsGround } from '../model/windowsFront';
import type { LevelSpec, OpeningSpec } from './architecturalTypes';

type LegacyOpeningRect = {
  id: string;
  level: 'ground' | 'first';
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

function frontEdgeIndexAtMaxArchitecturalZ(level: LevelSpec): number {
  const outer = level.footprint.outer;
  let bestIndex = 0;
  let bestZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < outer.length; i += 1) {
    const a = outer[i];
    const b = outer[(i + 1) % outer.length];
    const edgeFrontness = Math.max(a.z, b.z);
    if (edgeFrontness > bestZ) {
      bestZ = edgeFrontness;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function toEngineOpening(rect: LegacyOpeningRect, level: LevelSpec, edgeIndex: number): OpeningSpec {
  const a = level.footprint.outer[edgeIndex];
  const b = level.footprint.outer[(edgeIndex + 1) % level.footprint.outer.length];
  const rightX = Math.max(a.x, b.x);

  const width = rect.xMax - rect.xMin;
  const height = rect.yMax - rect.yMin;
  const offsetFromRight = rightX - rect.xMax;

  return {
    id: rect.id,
    kind: rect.id.toUpperCase().includes('DOOR') ? 'door' : 'window',
    levelId: level.id,
    edge: {
      levelId: level.id,
      ring: 'outer',
      edgeIndex,
      fromEnd: true,
    },
    offset: Math.max(0, offsetFromRight),
    width,
    sillHeight: rect.yMin,
    height,
  };
}

export function legacyFrontOpeningsToEngineOpenings(levels: LevelSpec[]): OpeningSpec[] {
  const byLevel = new Map(levels.map((level) => [level.id, level]));

  const sourceRects: LegacyOpeningRect[] = [...frontOpeningRectsGround, ...frontOpeningRectsFirst];

  return sourceRects.flatMap((rect) => {
    const levelId = rect.level === 'ground' ? 'ground' : 'first';
    const level = byLevel.get(levelId);
    if (!level) return [];

    const edgeIndex = frontEdgeIndexAtMaxArchitecturalZ(level);
    return [toEngineOpening(rect, level, edgeIndex)];
  });
}
