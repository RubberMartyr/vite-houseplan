import {
  footprint,
  wallThickness,
  groundFloorRooms,
  RoomRange,
  frontZ,
  rearZ,
  leftX,
  rightX,
} from './houseSpec';
import { layoutFloor } from './builders/layoutFloor';

const interior = {
  xMin: leftX + wallThickness.exterior,
  xMax: rightX - wallThickness.exterior,
  zMin: frontZ + wallThickness.exterior,
  zMax: rearZ - wallThickness.exterior,
};

const interiorWidth = interior.xMax - interior.xMin;
const interiorDepth = interior.zMax - interior.zMin;

const zones = [
  {
    id: 'living',
    width: groundFloorRooms.zithoek.width,
    rooms: [
      { id: 'zithoek', label: 'Zithoek', depth: groundFloorRooms.zithoek.depth },
      { id: 'keuken', label: 'Keuken', depth: groundFloorRooms.keuken.depth },
      { id: 'eethoek', label: 'Eethoek', depth: groundFloorRooms.eethoek.depth },
    ],
  },
  {
    id: 'service',
    width: groundFloorRooms.serviceStrip.width,
    rooms: [
      { id: 'hall', label: 'Inkom', depth: groundFloorRooms.serviceStrip.hallDepth },
      { id: 'stair', label: 'Trap', depth: groundFloorRooms.serviceStrip.stairDepth },
      { id: 'berging', label: 'Berging', depth: groundFloorRooms.serviceStrip.bergingDepth },
    ],
  },
];

const layout = layoutFloor({ interior, zones });

const livingDepthTotal = zones[0].rooms.reduce((total, room) => total + room.depth, 0);
const serviceDepthTotal = zones[1].rooms.reduce((total, room) => total + room.depth, 0);
const livingEnd = layout.rooms.eethoek.zMax;
const serviceEnd = layout.rooms.berging.zMax;

const roomRanges: Record<string, RoomRange> = {
  zithoek: layout.rooms.zithoek,
  keuken: layout.rooms.keuken,
  eethoek: layout.rooms.eethoek,
  hall: layout.rooms.hall,
  stair: layout.rooms.stair,
  berging: layout.rooms.berging,
};

export const layoutGround = {
  footprint,
  wallThickness,
  interior: {
    ...interior,
    width: interiorWidth,
    depth: interiorDepth,
  },
  zones: {
    living: layout.zones.living,
    service: layout.zones.service,
  },
  depthScale: layout.depthScale,
  livingDepthTotal,
  serviceDepthTotal,
  livingEnd,
  serviceEnd,
  rooms: roomRanges,
};
