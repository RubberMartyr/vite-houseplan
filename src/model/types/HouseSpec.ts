import type { EnvelopePoint } from '../houseSpec';

export interface HouseSpec {
  envelopeOutline: EnvelopePoint[];
  wallThickness: {
    exterior: number;
    interior: number;
  };
  ceilingHeights: {
    ground: number;
    first: number;
    [key: string]: number;
  };
  levelHeights: {
    firstFloor: number;
    [key: string]: number;
  };
  originOffset: { x: number; z: number };
  groundFloorRooms: {
    [roomId: string]: {
      width?: number;
      depth?: number;
      [key: string]: any;
    };
  };
}
