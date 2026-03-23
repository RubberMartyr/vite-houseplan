import type { Footprint, SiteSurfaceSpec, Vec2 } from '../architecturalTypes';

type SiteAccessPathSpec = {
  houseFootprint: Footprint;
  lotFootprint: Footprint;
  doorCenterOffset: number;
  doorWidth: number;
};

const COBBLESTONE_COLOR = '#3b82f6';
const PATH_WIDTH = 1;
const RIGHT_AREA_FRONT_START_X = 1.7;
const FRONT_BOUNDARY_Z = -6;
const RIGHT_AREA_REAR_EXTENSION = 1;

function findPoint(points: Vec2[], predicate: (point: Vec2) => boolean, label: string): Vec2 {
  const point = points.find(predicate);

  if (!point) {
    throw new Error(`Unable to locate ${label} in lot/site footprint.`);
  }

  return point;
}

function interpolateXAtZ(start: Vec2, end: Vec2, z: number): number {
  const deltaZ = end.z - start.z;

  if (Math.abs(deltaZ) < 1e-9) {
    return start.x;
  }

  const t = (z - start.z) / deltaZ;
  return start.x + (end.x - start.x) * t;
}

export function buildLot1aSiteSurfaces({
  houseFootprint,
  lotFootprint,
  doorCenterOffset,
  doorWidth,
}: SiteAccessPathSpec): SiteSurfaceSpec[] {
  const houseOuter = houseFootprint.outer;
  const lotOuter = lotFootprint.outer;

  const frontLeft = findPoint(houseOuter, (point) => point.x === -4.8 && point.z === 0, 'house front-left corner');
  const frontRight = findPoint(houseOuter, (point) => point.x === 4.8 && point.z === 0, 'house front-right corner');
  const lowerLeftIndentStart = findPoint(houseOuter, (point) => point.x === -4.8 && point.z === 4, 'lower left indentation');
  const midLeftIndentStart = findPoint(houseOuter, (point) => point.x === -4.1 && point.z === 4, 'mid left path start');
  const midLeftIndentEnd = findPoint(houseOuter, (point) => point.x === -4.1 && point.z === 8.45, 'mid left path end');
  const houseRightRear = findPoint(houseOuter, (point) => point.x === 4.8 && point.z === 15, 'house right rear corner');
  const lotFrontRight = findPoint(lotOuter, (point) => point.z === FRONT_BOUNDARY_Z, 'lot front-right corner');
  const lotRearRight = lotOuter[2];

  const frontDoorCenterX = frontLeft.x + doorCenterOffset;
  const doorPathMinX = frontDoorCenterX - doorWidth / 2;
  const doorPathMaxX = frontDoorCenterX + doorWidth / 2;
  const rightAreaRearZ = houseRightRear.z + RIGHT_AREA_REAR_EXTENSION;
  const rightAreaRearX = interpolateXAtZ(lotFrontRight, lotRearRight, rightAreaRearZ);

  return [
    {
      id: 'lot1a-right-cobblestone-field',
      color: COBBLESTONE_COLOR,
      polygon: [
        { x: RIGHT_AREA_FRONT_START_X, z: FRONT_BOUNDARY_Z },
        { x: lotFrontRight.x, z: FRONT_BOUNDARY_Z },
        { x: rightAreaRearX, z: rightAreaRearZ },
        { x: RIGHT_AREA_FRONT_START_X, z: rightAreaRearZ },
      ],
    },
    {
      id: 'lot1a-front-perimeter-path',
      color: COBBLESTONE_COLOR,
      polygon: [
        { x: frontLeft.x, z: frontLeft.z - PATH_WIDTH },
        { x: frontRight.x, z: frontRight.z - PATH_WIDTH },
        { x: frontRight.x, z: frontRight.z },
        { x: frontLeft.x, z: frontLeft.z },
      ],
    },
    {
      id: 'lot1a-left-lower-path',
      color: COBBLESTONE_COLOR,
      polygon: [
        { x: frontLeft.x - PATH_WIDTH, z: frontLeft.z },
        { x: frontLeft.x, z: frontLeft.z },
        { x: lowerLeftIndentStart.x, z: lowerLeftIndentStart.z },
        { x: lowerLeftIndentStart.x - PATH_WIDTH, z: lowerLeftIndentStart.z },
      ],
    },
    {
      id: 'lot1a-left-mid-path',
      color: COBBLESTONE_COLOR,
      polygon: [
        { x: midLeftIndentStart.x - PATH_WIDTH, z: midLeftIndentStart.z },
        { x: midLeftIndentStart.x, z: midLeftIndentStart.z },
        { x: midLeftIndentEnd.x, z: midLeftIndentEnd.z },
        { x: midLeftIndentEnd.x - PATH_WIDTH, z: midLeftIndentEnd.z },
      ],
    },
    {
      id: 'lot1a-front-door-path',
      color: COBBLESTONE_COLOR,
      polygon: [
        { x: doorPathMinX, z: FRONT_BOUNDARY_Z },
        { x: doorPathMaxX, z: FRONT_BOUNDARY_Z },
        { x: doorPathMaxX, z: frontLeft.z },
        { x: doorPathMinX, z: frontLeft.z },
      ],
    },
  ];
}
