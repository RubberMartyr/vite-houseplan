import type { DerivedWallSegment } from '../deriveWalls';
import { getWallVisibleBaseY, getWallVisibleTopY } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import { debugFlags } from '../debug/debugFlags';

const EPSILON = 1e-6;
const SEPARATOR_HEIGHT_MIN = 0.05;
const SEPARATOR_HEIGHT_MAX = 0.4;

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
        const baseDiff = getWallVisibleBaseY(a) - getWallVisibleBaseY(b);
        if (!approxEqual(baseDiff, 0)) return baseDiff;
        return a.id.localeCompare(b.id);
      }),
    }));
}

function mergeVerticalRuns(walls: DerivedWallSegment[]): DerivedWallSegment[][] {
  if (!walls.length) return [];

  const runs: DerivedWallSegment[][] = [];
  let currentRun: DerivedWallSegment[] = [walls[0]];
  let currentTop = getWallVisibleTopY(walls[0]);

  for (let i = 1; i < walls.length; i += 1) {
    const wall = walls[i];
    const base = getWallVisibleBaseY(wall);
    const top = getWallVisibleTopY(wall);

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

function getOverlapLength(aMin: number, aMax: number, bMin: number, bMax: number): number {
  return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));
}

function bridgeMergedStackOpenings(openings: DerivedOpening[]): DerivedOpening[] {
  return openings.map((opening) => {
    if (opening.style.mergeWithBelow !== true) {
      return opening;
    }

    const closestBelow = openings
      .filter((candidate) => {
        if (candidate.id === opening.id) return false;
        if (candidate.wallId !== opening.wallId) return false;
        if (candidate.vMax > opening.vMin + EPSILON) return false;
        return getOverlapLength(candidate.uMin, candidate.uMax, opening.uMin, opening.uMax) > EPSILON;
      })
      .sort((a, b) => b.vMax - a.vMax)[0];

    if (!closestBelow) {
      return opening;
    }

    return {
      ...opening,
      vMin: closestBelow.vMax,
      height: opening.vMax - closestBelow.vMax,
      centerArch: {
        ...opening.centerArch,
        y: opening.centerArch.y - (opening.vMin - closestBelow.vMax) / 2,
      },
    };
  });
}

export function mergeExteriorWallsForRendering(
  walls: DerivedWallSegment[],
  openings: DerivedOpening[]
): MergeResult {
  const debugEnabled = debugFlags.enabled;
  const mergedWalls: DerivedWallSegment[] = [];
  const openingWallIdMap = new Map<string, { mergedWallId: string; renderedBaseY: number }>();

  if (debugEnabled) {
    const separatorCandidateOpenings = openings.filter((opening) => {
      const height = opening.vMax - opening.vMin;
      return height > SEPARATOR_HEIGHT_MIN && height < SEPARATOR_HEIGHT_MAX;
    });

    console.debug('[separator-debug]', {
      stage: 'mergeExteriorWallsForRendering:start',
      inputWallCount: walls.length,
      inputOpeningCount: openings.length,
      separatorCandidateOpeningCount: separatorCandidateOpenings.length,
      separatorCandidateOpenings: separatorCandidateOpenings.map((opening) => ({
        openingId: opening.id,
        wallId: opening.wallId,
        vMin: opening.vMin,
        vMax: opening.vMax,
        height: opening.vMax - opening.vMin,
      })),
    });
  }

  for (const group of groupWallsByPlanEdge(walls)) {
    const runs = mergeVerticalRuns(group.walls);

    for (const run of runs) {
      const first = run[0];
      const renderedBaseY = Math.min(...run.map((wall) => getWallVisibleBaseY(wall)));
      const renderedTopY = Math.max(...run.map((wall) => getWallVisibleTopY(wall)));
      const mergedWallId = run.length === 1 ? first.id : createMergedWallId(run);
      const sortedLevelIds = [...new Set(run.map((wall) => wall.levelId))].sort();

      const mergedWall: DerivedWallSegment = {
        ...first,
        id: mergedWallId,
        levelId: sortedLevelIds.join('__'),
        height: first.height,
        uOffset: 0,
        visibleBaseY: renderedBaseY,
        visibleHeight: renderedTopY - renderedBaseY,
      };

      mergedWalls.push(mergedWall);

      for (const sourceWall of run) {
        openingWallIdMap.set(sourceWall.id, {
          mergedWallId,
          renderedBaseY,
        });
      }

      if (debugEnabled) {
        console.debug('[separator-debug]', {
          stage: 'mergeExteriorWallsForRendering:run',
          sourceWallIds: run.map((wall) => wall.id),
          mergedWallId,
          renderedBaseY,
          renderedTopY,
          sourceWallCount: run.length,
        });
      }
    }
  }

  const mergedOpenings = openings.flatMap((opening) => {
    const mapping = openingWallIdMap.get(opening.wallId);
    if (!mapping) return [];

    const openingLocalCenterY = (opening.vMin + opening.vMax) / 2;
    const sourceWallBaseY = opening.centerArch.y - openingLocalCenterY;
    const baseShift = sourceWallBaseY - mapping.renderedBaseY;
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

  const bridgedOpenings = bridgeMergedStackOpenings(mergedOpenings);

  mergedWalls.sort((a, b) => a.id.localeCompare(b.id));
  bridgedOpenings.sort((a, b) => (a.wallId.localeCompare(b.wallId) || a.uMin - b.uMin || a.vMin - b.vMin));

  if (debugEnabled) {
    console.debug('[separator-debug]', {
      stage: 'mergeExteriorWallsForRendering:end',
      outputWallCount: mergedWalls.length,
      outputOpeningCount: bridgedOpenings.length,
      mergedWallIds: mergedWalls.map((wall) => wall.id),
      mergedOpeningWallIds: bridgedOpenings.map((opening) => ({
        openingId: opening.id,
        wallId: opening.wallId,
        vMin: opening.vMin,
        vMax: opening.vMax,
      })),
    });
  }

  return {
    walls: mergedWalls,
    openings: bridgedOpenings,
  };
}
