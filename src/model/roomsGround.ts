import { ceilingHeights } from './houseSpec'
import { layoutGround } from './layoutGround'

export type RoomVolume = {
  id: string
  label: string
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number; yMin: number; yMax: number }
}

const groundCeilingHeight = ceilingHeights.ground

export const roomsGround: RoomVolume[] = [
  {
    id: 'gf_zithoek',
    label: 'Zithoek',
    bounds: { ...layoutGround.rooms.zithoek, yMin: 0, yMax: groundCeilingHeight },
  },
  {
    id: 'gf_keuken',
    label: 'Keuken',
    bounds: { ...layoutGround.rooms.keuken, yMin: 0, yMax: groundCeilingHeight },
  },
  {
    id: 'gf_eethoek',
    label: 'Eethoek',
    bounds: { ...layoutGround.rooms.eethoek, yMin: 0, yMax: groundCeilingHeight },
  },
  {
    id: 'gf_inkom',
    label: 'Inkom',
    bounds: { ...layoutGround.rooms.hall, yMin: 0, yMax: groundCeilingHeight },
  },
  {
    id: 'gf_trap',
    label: 'Trap',
    bounds: { ...layoutGround.rooms.stair, yMin: 0, yMax: groundCeilingHeight },
  },
  {
    id: 'gf_berging',
    label: 'Berging',
    bounds: { ...layoutGround.rooms.berging, yMin: 0, yMax: groundCeilingHeight },
  },
]
