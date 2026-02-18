import type { RoomRange } from '../houseSpec';

export interface RoomSpec {
  id: string;
  label: string;
  depth: number;
}

export interface ZoneSpec {
  id: string;
  width: number;
  rooms: RoomSpec[];
}

export interface InteriorBounds {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

export function layoutFloor(params: {
  interior: InteriorBounds;
  zones: ZoneSpec[];
}): {
  zones: Record<string, Pick<RoomRange, 'xMin' | 'xMax'>>;
  rooms: Record<string, RoomRange>;
  depthScale: number;
} {
  const { interior, zones } = params;
  const interiorWidth = interior.xMax - interior.xMin;
  const interiorDepth = interior.zMax - interior.zMin;

  const totalZoneWidth = zones.reduce((sum, zone) => sum + zone.width, 0);
  const widthScale = totalZoneWidth > interiorWidth ? interiorWidth / totalZoneWidth : 1;

  let xCursor = interior.xMin;
  const zoneRanges = zones.reduce<Record<string, Pick<RoomRange, 'xMin' | 'xMax'>>>((acc, zone) => {
    const zoneWidth = zone.width * widthScale;
    acc[zone.id] = {
      xMin: xCursor,
      xMax: xCursor + zoneWidth,
    };
    xCursor += zoneWidth;
    return acc;
  }, {});

  const maxZoneDepthTotal = Math.max(
    ...zones.map((zone) => zone.rooms.reduce((sum, room) => sum + room.depth, 0))
  );
  const depthScale = maxZoneDepthTotal > interiorDepth ? interiorDepth / maxZoneDepthTotal : 1;

  const roomRanges = zones.reduce<Record<string, RoomRange>>((acc, zone) => {
    const zoneRange = zoneRanges[zone.id];
    let zCursor = interior.zMin;

    zone.rooms.forEach((room) => {
      const depth = room.depth * depthScale;
      acc[room.id] = {
        xMin: zoneRange.xMin,
        xMax: zoneRange.xMax,
        zMin: zCursor,
        zMax: zCursor + depth,
      };
      zCursor += depth;
    });

    return acc;
  }, {});

  return {
    zones: zoneRanges,
    rooms: roomRanges,
    depthScale,
  };
}
