import { ceilingHeights } from './houseSpec';
import { layoutGround } from './layoutGround';

export type RoomVolume = {
  id: string;
  label: string;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number; yMin: number; yMax: number };
};

const groundCeilingHeight = ceilingHeights.ground;

function buildFloorRooms(params: {
  floorLevel: number;
  ceilingHeight: number;
  rooms: Array<{
    id: string;
    label: string;
    bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
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

export const roomsGround: RoomVolume[] = buildFloorRooms({
  floorLevel: 0,
  ceilingHeight: groundCeilingHeight,
  rooms: [
    { id: 'gf_zithoek', label: 'Zithoek', bounds: layoutGround.rooms.zithoek },
    { id: 'gf_keuken', label: 'Keuken', bounds: layoutGround.rooms.keuken },
    { id: 'gf_eethoek', label: 'Eethoek', bounds: layoutGround.rooms.eethoek },
    { id: 'gf_inkom', label: 'Inkom', bounds: layoutGround.rooms.hall },
    { id: 'gf_trap', label: 'Trap', bounds: layoutGround.rooms.stair },
    { id: 'gf_berging', label: 'Berging', bounds: layoutGround.rooms.berging },
  ],
});
