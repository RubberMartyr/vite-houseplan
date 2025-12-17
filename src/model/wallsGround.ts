import { layoutGround } from './layoutGround';
import { ceilingHeights, wallThickness } from './houseSpec';
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

const { width: footprintWidth, depth: footprintDepth } = layoutGround.footprint;
const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;

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

function buildFacadeSegments(
  xStart: number,
  xEnd: number,
  zMin: number,
  zMax: number,
  openings: Opening[]
): WallSegment[] {
  const sections: WallSegment[] = [];
  const sorted = [...openings]
    .map((opening) => normalizeOpening(opening))
    .sort((a, b) => a.xMin - b.xMin);
  let cursor = xStart;

  sorted.forEach((opening) => {
    const openingTop = Math.min(opening.bottom + opening.height, wallHeight);
    const openingHeight = Math.max(0, openingTop - opening.bottom);

    if (opening.xMin > cursor) {
      sections.push(createWallSegment(cursor, opening.xMin, opening.zMin, opening.zMax, wallHeight));
    }

    if (opening.bottom > 0 && openingHeight > 0) {
      sections.push(
        createWallSegment(
          opening.xMin,
          opening.xMax,
          opening.zMin,
          opening.zMax,
          opening.bottom
        )
      );
    }

    if (openingHeight > 0 && openingTop < wallHeight) {
      sections.push(
        createWallSegment(
          opening.xMin,
          opening.xMax,
          opening.zMin,
          opening.zMax,
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

function normalizeOpening(opening: Opening): Opening {
  const clampedHeight = Math.max(0, Math.min(opening.height, wallHeight - opening.bottom));
  return {
    ...opening,
    height: clampedHeight,
  };
}

const zoneA = layoutGround.zones.living;
const zoneB = layoutGround.zones.service;
const facadeOpenings: Record<'front' | 'rear', Opening[]> = {
  front: [],
  rear: [],
};

const livingCenter = (zoneA.xMin + zoneA.xMax) / 2;
const serviceCenter = (zoneB.xMin + zoneB.xMax) / 2;

facadeOpenings.front.push({
  xMin: livingCenter - 1.2,
  xMax: livingCenter + 1.2,
  bottom: 0.9,
  height: 1.8,
  zMin: 0,
  zMax: exteriorThickness,
});

facadeOpenings.front.push({
  xMin: serviceCenter - 0.95 / 2,
  xMax: serviceCenter + 0.95 / 2,
  bottom: 0,
  height: 2.1,
  zMin: 0,
  zMax: exteriorThickness,
});

facadeOpenings.rear.push({
  xMin: livingCenter - 4 / 2,
  xMax: livingCenter + 4 / 2,
  bottom: 0,
  height: 2.4,
  zMin: footprintDepth - exteriorThickness,
  zMax: footprintDepth,
});

facadeOpenings.rear.push({
  xMin: serviceCenter - 0.9 / 2,
  xMax: serviceCenter + 0.9 / 2,
  bottom: 0,
  height: 2.1,
  zMin: footprintDepth - exteriorThickness,
  zMax: footprintDepth,
});

const segments: WallSegment[] = [];

segments.push(
  ...buildFacadeSegments(0, footprintWidth, 0, exteriorThickness, facadeOpenings.front)
);
segments.push(
  ...buildFacadeSegments(
    0,
    footprintWidth,
    footprintDepth - exteriorThickness,
    footprintDepth,
    facadeOpenings.rear
  )
);

segments.push(createWallSegment(0, exteriorThickness, 0, footprintDepth, wallHeight));
segments.push(
  createWallSegment(
    footprintWidth - exteriorThickness,
    footprintWidth,
    0,
    footprintDepth,
    wallHeight
  )
);

export const wallsGround = {
  segments,
};
