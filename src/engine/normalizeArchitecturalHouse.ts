import type { ArchitecturalHouse, LevelSpec } from './architecturalTypes';

function normalizeLevel(level: LevelSpec): LevelSpec {
  return {
    ...level,
    name: level.name ?? level.id,
  };
}

export function normalizeArchitecturalHouse(house: ArchitecturalHouse): ArchitecturalHouse {
  return {
    ...house,
    levels: house.levels.map(normalizeLevel),
  };
}
