import {
  footprint,
  wallThickness,
  groundFloorRooms,
  RoomRange,
} from './houseSpec';

const interior = {
  xMin: wallThickness.exterior,
  xMax: footprint.width - wallThickness.exterior,
  zMin: wallThickness.exterior,
  zMax: footprint.depth - wallThickness.exterior,
};

const interiorWidth = interior.xMax - interior.xMin;
const interiorDepth = interior.zMax - interior.zMin;

const livingWidth = groundFloorRooms.zithoek.width;
const serviceWidth = groundFloorRooms.serviceStrip.width;

let zoneA: Pick<RoomRange, 'xMin' | 'xMax'> = {
  xMin: interior.xMin,
  xMax: interior.xMin + livingWidth,
};
let zoneB: Pick<RoomRange, 'xMin' | 'xMax'> = {
  xMin: zoneA.xMax,
  xMax: zoneA.xMax + serviceWidth,
};

const totalWidth = zoneB.xMax - zoneA.xMin;
if (totalWidth > interiorWidth) {
  const overlap = totalWidth - interiorWidth;
  zoneA = {
    xMin: zoneA.xMin - overlap / 2,
    xMax: zoneA.xMax - overlap / 2,
  };
  zoneB = {
    xMin: zoneB.xMin - overlap / 2,
    xMax: zoneB.xMax - overlap / 2,
  };
}

const livingDepths = [
  groundFloorRooms.zithoek.depth,
  groundFloorRooms.keuken.depth,
  groundFloorRooms.eethoek.depth,
];
const serviceDepths = [
  groundFloorRooms.serviceStrip.hallDepth,
  groundFloorRooms.serviceStrip.stairDepth,
  groundFloorRooms.serviceStrip.bergingDepth,
];

const livingDepthTotal = livingDepths.reduce((total, value) => total + value, 0);
const serviceDepthTotal = serviceDepths.reduce((total, value) => total + value, 0);
const maxDepthTotal = Math.max(livingDepthTotal, serviceDepthTotal);
const depthScale = maxDepthTotal > interiorDepth ? interiorDepth / maxDepthTotal : 1;

const scaledLivingDepths = livingDepths.map((depth) => depth * depthScale);
const scaledServiceDepths = serviceDepths.map((depth) => depth * depthScale);

function accumulateRanges(start: number, lengths: number[]): { ranges: RoomRange[]; end: number } {
  const ranges: RoomRange[] = [];
  let cursor = start;
  lengths.forEach((length) => {
    ranges.push({
      xMin: 0,
      xMax: 0,
      zMin: cursor,
      zMax: cursor + length,
    });
    cursor += length;
  });
  return { ranges, end: cursor };
}

const { ranges: livingZRanges, end: livingEnd } = accumulateRanges(
  interior.zMin,
  scaledLivingDepths
);
const { ranges: serviceZRanges, end: serviceEnd } = accumulateRanges(
  interior.zMin,
  scaledServiceDepths
);

const roomRanges = {
  zithoek: { ...livingZRanges[0], ...zoneA },
  keuken: { ...livingZRanges[1], ...zoneA },
  eethoek: { ...livingZRanges[2], ...zoneA },
  hall: { ...serviceZRanges[0], ...zoneB },
  stair: { ...serviceZRanges[1], ...zoneB },
  berging: { ...serviceZRanges[2], ...zoneB },
};

const layoutGround = {
  footprint,
  wallThickness,
  interior: {
    ...interior,
    width: interiorWidth,
    depth: interiorDepth,
  },
  zones: {
    living: zoneA,
    service: zoneB,
  },
  depthScale,
  livingDepthTotal,
  serviceDepthTotal,
  livingEnd,
  serviceEnd,
  rooms: roomRanges,
};

export default layoutGround;
