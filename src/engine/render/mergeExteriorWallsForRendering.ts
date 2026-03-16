import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';

const EPSILON = 1e-6;

type WallMergeGroup = {
  walls: DerivedWallSegment[];
};

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

function quantize(value: number): string {
  return value.toFixed(6);
}

function createPlanEdgeKey(wall: DerivedWallSegment): string {
  return [
    quantize(wall.start.x),
    quantize(wall.start.z),
    quantize(wall.end.x),
    quantize(wall.end.z),
    quantize(wall.thickness),
    String(wall.outwardSign),
  ].join('|');
}

function createMergedWallId(walls: DerivedWallSegment[]): string {
  const ids = walls.map((wall) => wall.id).sort();
  return `wall-merged-${ids.join('__')}`;
}

function groupWallsByPlanEdge(walls: DerivedWallSegment[]): WallMergeGroup[] {
  const groupsByKey = new Map<string, DerivedWallSegment[]>();

  for (const wall of walls) {
    const key = createPlanEdgeKey(wall);
    const bucket = groupsByKey.get(key) ?? [];
    bucket.push(wall);
    groupsByKey.set(key, bucket);
  }

  return [...groupsByKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, groupedWalls]) => ({
      walls: groupedWalls.sort((a, b) => {
        if (!approxEqual(a.start.y, b.start.y)) return a.start.y - b.start.y;
        return a.id.localeCompare(b.id);
      }),
    }));
}

function mergeVerticalRuns(walls: DerivedWallSegment[]): DerivedWallSegment[][] {
  if (!walls.length) return [];

  const runs: DerivedWallSegment[][] = [];
  let currentRun: DerivedWallSegment[] = [walls[0]];
  let currentTop = walls[0].start.y + walls[0].height;

  for (let i = 1; i < walls.length; i += 1) {
    const wall = walls[i];
    const base = wall.start.y;
    const top = base + wall.height;

    if (base <= currentTop + EPSILON) {
      currentRun.push(wall);
      currentTop = Math.max(currentTop, top);
      continue;
    }

    runs.push(currentRun);
    currentRun = [wall];
    currentTop = top;
  }

  runs.push(currentRun);
  return runs;
}

type MergeResult = {
  walls: DerivedWallSegment[];
  openings: DerivedOpening[];
};

export function mergeExteriorWallsForRendering(
  walls: DerivedWallSegment[],
  openings: DerivedOpening[]
): MergeResult {
  const mergedWalls: DerivedWallSegment[] = [];
  const openingWallIdMap = new Map<string, { mergedWallId: string; baseY: number }>();

  for (const group of groupWallsByPlanEdge(walls)) {
    const runs = mergeVerticalRuns(group.walls);

    for (const run of runs) {
      const first = run[0];
      const baseY = run[0].start.y;
      const topY = Math.max(...run.map((wall) => wall.start.y + wall.height));
      const mergedWallId = run.length === 1 ? first.id : createMergedWallId(run);
      const sortedLevelIds = [...new Set(run.map((wall) => wall.levelId))].sort();

      const mergedWall: DerivedWallSegment = {
        ...first,
        id: mergedWallId,
        levelId: sortedLevelIds.join('__'),
        start: { ...first.start, y: baseY },
        end: { ...first.end, y: baseY },
        height: topY - baseY,
        uOffset: 0,
      };

      mergedWalls.push(mergedWall);

      for (const sourceWall of run) {
        openingWallIdMap.set(sourceWall.id, {
          mergedWallId,
          baseY,
        });
      }
    }
  }

  const mergedOpenings = openings.flatMap((opening) => {
    const mapping = openingWallIdMap.get(opening.wallId);
    if (!mapping) return [];

    if (mapping.mergedWallId === opening.wallId) {
      return [opening];
    }

    const openingLocalCenterY = (opening.vMin + opening.vMax) / 2;
    const sourceWallBaseY = opening.centerArch.y - openingLocalCenterY;
    const baseShift = sourceWallBaseY - mapping.baseY;
    return [
      {
        ...opening,
        wallId: mapping.mergedWallId,
        vMin: opening.vMin + baseShift,
        vMax: opening.vMax + baseShift,
        centerArch: {
          ...opening.centerArch,
        },
      },
    ];
  });

  mergedWalls.sort((a, b) => a.id.localeCompare(b.id));
  mergedOpenings.sort((a, b) => (a.wallId.localeCompare(b.wallId) || a.uMin - b.uMin || a.vMin - b.vMin));

  return {
    walls: mergedWalls,
    openings: mergedOpenings,
  };
}
