import { ceilingHeights, levelHeights } from './houseSpec'
import { layoutGround } from './layoutGround'
import { RoomVolume } from './roomsGround'

const firstFloorLevel = levelHeights.firstFloor
const firstFloorCeilingHeight = ceilingHeights.first
const { rooms: groundRooms, zones } = layoutGround

const yMin = firstFloorLevel
const yMax = firstFloorLevel + firstFloorCeilingHeight

export const roomsFirst: RoomVolume[] = [
  {
    id: 'ff_slaapkamer1',
    label: 'Slaapkamer 1',
    bounds: { ...zones.living, zMin: groundRooms.zithoek.zMin, zMax: groundRooms.zithoek.zMax, yMin, yMax },
  },
  {
    id: 'ff_dressing',
    label: 'Dressing',
    bounds: { ...zones.service, zMin: groundRooms.hall.zMin, zMax: groundRooms.hall.zMax, yMin, yMax },
  },
  {
    id: 'ff_slaapkamer2',
    label: 'Slaapkamer 2',
    bounds: { ...zones.living, zMin: groundRooms.keuken.zMin, zMax: groundRooms.keuken.zMax, yMin, yMax },
  },
  {
    id: 'ff_slaapkamer3',
    label: 'Slaapkamer 3',
    bounds: { ...zones.living, zMin: groundRooms.eethoek.zMin, zMax: groundRooms.eethoek.zMax, yMin, yMax },
  },
  {
    id: 'ff_badkamer',
    label: 'Badkamer',
    bounds: { ...zones.service, zMin: groundRooms.berging.zMin, zMax: groundRooms.berging.zMax, yMin, yMax },
  },
  {
    id: 'ff_overloop',
    label: 'Overloop',
    bounds: { ...zones.service, zMin: groundRooms.stair.zMin, zMax: groundRooms.stair.zMax, yMin, yMax },
  },
]
