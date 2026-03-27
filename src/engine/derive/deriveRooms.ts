import type { ArchitecturalHouse } from '../architecturalTypes';
import type { DerivedRoom } from './types/DerivedRoom';

export function deriveRooms(arch: ArchitecturalHouse): DerivedRoom[] {
  if (!arch.rooms?.length) {
    return [];
  }

  const levelElevationById = new Map(arch.levels.map((level) => [level.id, level.elevation]));

  return arch.rooms.flatMap((room) => {
    const elevation = levelElevationById.get(room.levelId);
    if (elevation == null) {
      return [];
    }

    return [{
      id: room.id,
      name: room.name,
      levelId: room.levelId,
      elevation,
      polygon: room.polygon.map((point) => ({ ...point })),
    }];
  });
}
