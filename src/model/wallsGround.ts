import { layoutGround } from './layoutGround';
import { getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, wallThickness, frontZ, rearZ } from './houseSpec';
import { BoxGeometry } from 'three';

type WallSegment = {
  position: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

type Opening = {
  xMin: number;
  xMax: number;
  bottom: number;
  height: number;
  zMin: number;
  zMax: number;
};

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;

function signedPolygonArea(points: { x: number; z: number }[]): number {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.z - next.x * point.z;
  }, 0);
}

function createWallSegment(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  height: number,
  yOffset = 0
): WallSegment {
  return {
    position: [
      (xMin + xMax) / 2,
      yOffset + height / 2,
      (zMin + zMax) / 2,
    ],
    size: [xMax - xMin, height, zMax - zMin],
    rotation: [0, 0, 0],
    geometry: new BoxGeometry(xMax - xMin, height, zMax - zMin),
  };
}

function normalizeOpening(opening: Opening): Opening {
  const clampedHeight = Math.max(0, Math.min(opening.height, wallHeight - opening.bottom));
  return {
    ...opening,
    height: clampedHeight,
  };
}

function buildFacadeSegments(
  xStart: number,
  xEnd: number,
  centerZ: number,
  openings: Opening[]
): WallSegment[] {
  const sections: WallSegment[] = [];
  const zMin = centerZ - exteriorThickness / 2;
  const zMax = centerZ + exteriorThickness / 2;
  const sorted = [...openings]
    .map((opening) => normalizeOpening(opening))
    .sort((a, b) => a.xMin - b.xMin);
  let cursor = xStart;

  sorted.forEach((opening) => {
    const openingTop = Math.min(opening.bottom + opening.height, wallHeight);
    const openingHeight = Math.max(0, openingTop - opening.bottom);

    if (opening.xMin > cursor) {
      sections.push(createWallSegment(cursor, opening.xMin, zMin, zMax, wallHeight));
    }

    if (opening.bottom > 0 && openingHeight > 0) {
      sections.push(
        createWallSegment(opening.xMin, opening.xMax, zMin, zMax, opening.bottom)
      );
    }

    if (openingHeight > 0 && openingTop < wallHeight) {
      sections.push(
        createWallSegment(
          opening.xMin,
          opening.xMax,
          zMin,
          zMax,
          wallHeight - openingTop,
          openingTop
        )
      );
    }

    cursor = Math.max(cursor, opening.xMax);
  });

  if (cursor < xEnd) {
    sections.push(createWallSegment(cursor, xEnd, zMin, zMax, wallHeight));
  }

  return sections;
}

const segments: WallSegment[] = [];

const facadeOpenings: Record<'front' | 'rear', Opening[]> = {
  front: [],
  rear: [],
};

const livingCenter = (layoutGround.zones.living.xMin + layoutGround.zones.living.xMax) / 2;
const serviceCenter = (layoutGround.zones.service.xMin + layoutGround.zones.service.xMax) / 2;

facadeOpenings.front.push({
  xMin: livingCenter - 1.2,
  xMax: livingCenter + 1.2,
  bottom: 0.9,
  height: 1.8,
  zMin: frontZ,
  zMax: frontZ + exteriorThickness,
});

facadeOpenings.front.push({
  xMin: serviceCenter - 0.95 / 2,
  xMax: serviceCenter + 0.95 / 2,
  bottom: 0,
  height: 2.1,
  zMin: frontZ,
  zMax: frontZ + exteriorThickness,
});

facadeOpenings.rear.push({
  xMin: livingCenter - 4 / 2,
  xMax: livingCenter + 4 / 2,
  bottom: 0,
  height: 2.4,
  zMin: rearZ - exteriorThickness,
  zMax: rearZ,
});

facadeOpenings.rear.push({
  xMin: serviceCenter - 0.9 / 2,
  xMax: serviceCenter + 0.9 / 2,
  bottom: 0,
  height: 2.1,
  zMin: rearZ - exteriorThickness,
  zMax: rearZ,
});

const envelopePolygon = getEnvelopeOuterPolygon();
const isClockwise = signedPolygonArea(envelopePolygon) < 0;

envelopePolygon.forEach((start, index) => {
  const end = envelopePolygon[(index + 1) % envelopePolygon.length];
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);

  if (length === 0) {
    return;
  }

  const midpoint: [number, number, number] = [
    (start.x + end.x) / 2,
    wallHeight / 2,
    (start.z + end.z) / 2,
  ];

  const ux = dx / length;
  const uz = dz / length;

  const nx = isClockwise ? -uz : uz;
  const nz = isClockwise ? ux : -ux;
  const centerOffset: [number, number, number] = [
    (nx * exteriorThickness) / 2,
    0,
    (nz * exteriorThickness) / 2,
  ];

  const angle = Math.atan2(dz, dx);

  const isFront = Math.abs(start.z - frontZ) < 1e-6 && Math.abs(end.z - frontZ) < 1e-6;
  const isRear = Math.abs(start.z - rearZ) < 1e-6 && Math.abs(end.z - rearZ) < 1e-6;

  if (isFront || isRear) {
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const openings = isFront ? facadeOpenings.front : facadeOpenings.rear;
    const centerZ = midpoint[2] + centerOffset[2];
    segments.push(...buildFacadeSegments(xMin, xMax, centerZ, openings));
    return;
  }

  segments.push({
    position: [
      midpoint[0] + centerOffset[0],
      midpoint[1],
      midpoint[2] + centerOffset[2],
    ],
    size: [length, wallHeight, exteriorThickness],
    rotation: [0, angle, 0],
    geometry: new BoxGeometry(length, wallHeight, exteriorThickness),
  });
});

export const wallsGround = {
  segments,
};
