import type { RoomVolume } from '../roomsGround';
import type { RoomRange } from '../houseSpec';

export function buildFloorRooms(params: {
  floorLevel: number;
  ceilingHeight: number;
  rooms: Array<{
    id: string;
    label: string;
    bounds: RoomRange;
  }>;
}): RoomVolume[] {
  const { floorLevel, ceilingHeight, rooms } = params;

  return rooms.map(({ id, label, bounds }) => ({
    id,
    label,
    bounds: {
      ...bounds,
      yMin: floorLevel,
      yMax: floorLevel + ceilingHeight,
    },
  }));
}
