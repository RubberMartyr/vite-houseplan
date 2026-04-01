import type { ArchitecturalHouse, LevelSpec } from '../architecturalTypes';

export function getSortedLevels(house: ArchitecturalHouse): LevelSpec[] {
  return [...house.levels].sort((a, b) => a.elevation - b.elevation);
}

export function getLowestLevel(house: ArchitecturalHouse): LevelSpec | null {
  const [lowest] = getSortedLevels(house);
  return lowest ?? null;
}

export function getHighestLevel(house: ArchitecturalHouse): LevelSpec | null {
  const sortedLevels = getSortedLevels(house);
  return sortedLevels[sortedLevels.length - 1] ?? null;
}

export function getLevelById(house: ArchitecturalHouse, levelId: string): LevelSpec | null {
  return house.levels.find((level) => level.id === levelId) ?? null;
}

export function getLevelIndex(house: ArchitecturalHouse, levelId: string): number {
  return getSortedLevels(house).findIndex((level) => level.id === levelId);
}

export function getLevelAbove(house: ArchitecturalHouse, levelId: string): LevelSpec | null {
  const sortedLevels = getSortedLevels(house);
  const levelIndex = sortedLevels.findIndex((level) => level.id === levelId);
  if (levelIndex < 0) return null;

  return sortedLevels[levelIndex + 1] ?? null;
}

export function getLevelBelow(house: ArchitecturalHouse, levelId: string): LevelSpec | null {
  const sortedLevels = getSortedLevels(house);
  const levelIndex = sortedLevels.findIndex((level) => level.id === levelId);
  if (levelIndex < 0) return null;

  return sortedLevels[levelIndex - 1] ?? null;
}

export function getDefaultRoofBaseLevel(house: ArchitecturalHouse): LevelSpec | null {
  return getHighestLevel(house);
}
