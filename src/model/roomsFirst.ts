import { ceilingHeights, levelHeights } from './houseSpec';
import { layoutGround } from './layoutGround';
import { RoomVolume } from './roomsGround';
import { buildFloorRooms } from './builders/buildFloorRooms';

const firstFloorLevel = levelHeights.firstFloor;
const firstFloorCeilingHeight = ceilingHeights.first;
const { rooms: groundRooms, zones } = layoutGround;

export const roomsFirst: RoomVolume[] = buildFloorRooms({
  floorLevel: firstFloorLevel,
  ceilingHeight: firstFloorCeilingHeight,
  rooms: [
    {
      id: 'ff_slaapkamer1',
      label: 'Slaapkamer 1',
      bounds: { ...zones.living, zMin: groundRooms.zithoek.zMin, zMax: groundRooms.zithoek.zMax },
    },
    {
      id: 'ff_dressing',
      label: 'Dressing',
      bounds: { ...zones.service, zMin: groundRooms.hall.zMin, zMax: groundRooms.hall.zMax },
    },
    {
      id: 'ff_slaapkamer2',
      label: 'Slaapkamer 2',
      bounds: { ...zones.living, zMin: groundRooms.keuken.zMin, zMax: groundRooms.keuken.zMax },
    },
    {
      id: 'ff_slaapkamer3',
      label: 'Slaapkamer 3',
      bounds: { ...zones.living, zMin: groundRooms.eethoek.zMin, zMax: groundRooms.eethoek.zMax },
    },
    {
      id: 'ff_badkamer',
      label: 'Badkamer',
      bounds: { ...zones.service, zMin: groundRooms.berging.zMin, zMax: groundRooms.berging.zMax },
    },
    {
      id: 'ff_overloop',
      label: 'Overloop',
      bounds: { ...zones.service, zMin: groundRooms.stair.zMin, zMax: groundRooms.stair.zMax },
    },
  ],
});
