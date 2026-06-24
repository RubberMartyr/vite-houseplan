import type { ArchitecturalHouse, LevelSpec } from './architecturalTypes';

function normalizeLevel(level: LevelSpec): LevelSpec {
  return {
    ...level,
    name: level.name ?? level.id,
  };
}

export function normalizeArchitecturalHouse(house: Partial<ArchitecturalHouse>): ArchitecturalHouse {
  return {
    ...house,
    wallThickness: house.wallThickness ?? 0.3,
    levels: (house.levels ?? []).map(normalizeLevel),
    rooms: house.rooms ?? [],
    openings: house.openings ?? [],
    roofs: house.roofs ?? [],
  } as ArchitecturalHouse;
}
