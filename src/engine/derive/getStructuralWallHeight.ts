import type { LevelSpec } from '../architecturalTypes';

export function getStructuralWallTop(levels: LevelSpec[], levelIndex: number): number {
  const level = levels[levelIndex];
  if (!level) {
    return NaN;
  }

  const nextLevel = levels[levelIndex + 1];
  if (!nextLevel) {
    return level.elevation + level.height;
  }

  return nextLevel.elevation - nextLevel.slab.thickness;
}

export function getStructuralWallHeight(levels: LevelSpec[], levelIndex: number): number {
  const level = levels[levelIndex];
  if (!level) {
    return NaN;
  }

  const wallTop = getStructuralWallTop(levels, levelIndex);
  return wallTop - level.elevation;
}
