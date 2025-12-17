import { layoutGround } from './layoutGround';
import {
  ceilingHeights,
  wallThickness,
  frontZ,
  rearZ,
  envelopeOutline,
  originOffset,
} from './houseSpec';
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

type EnvelopeEdge = { start: { x: number; z: number }; end: { x: number; z: number } };

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
      (xMin + xMax) / 2 + originOffset.x,
      yOffset + height / 2,
      (zMin + zMax) / 2 + originOffset.z,
    ],
    size: [xMax - xMin, height, zMax - zMin],
    rotation: [0, 0, 0],
    geometry: new BoxGeometry(xMax - xMin, height, zMax - zMin),
  };
}

function createOrientedWallSegment(
  edge: EnvelopeEdge,
  height: number,
  thickness: number,
  orientationNormal: [number, number]
): WallSegment {
  const dx = edge.end.x - edge.start.x;
  const dz = edge.end.z - edge.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const midpoint: [number, number, number] = [
    (edge.start.x + edge.end.x) / 2,
    height / 2,
    (edge.start.z + edge.end.z) / 2,
  ];
  const normal = orientationNormal;
  const centerOffset: [number, number, number] = [
    (normal[0] * thickness) / 2,
    0,
    (normal[1] * thickness) / 2,
  ];

  const angle = Math.atan2(dz, dx);

  return {
    position: [
      midpoint[0] + centerOffset[0] + originOffset.x,
      midpoint[1],
      midpoint[2] + centerOffset[2] + originOffset.z,
    ],
    size: [length, height, thickness],
    rotation: [0, angle, 0],
    geometry: new BoxGeometry(length, height, thickness),
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

function getEnvelopeEdges(outline: { x: number; z: number }[]): EnvelopeEdge[] {
  const edges: EnvelopeEdge[] = [];
  for (let i = 0; i < outline.length; i++) {
    const next = (i + 1) % outline.length;
    edges.push({ start: outline[i], end: outline[next] });
  }
  return edges;
}

const edges = getEnvelopeEdges(envelopeOutline);
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

edges.forEach((edge) => {
  const isFront = Math.abs(edge.start.z - frontZ) < 1e-6 && Math.abs(edge.end.z - frontZ) < 1e-6;
  const isRear = Math.abs(edge.start.z - rearZ) < 1e-6 && Math.abs(edge.end.z - rearZ) < 1e-6;

  if (isFront || isRear) {
    const xMin = Math.min(edge.start.x, edge.end.x);
    const xMax = Math.max(edge.start.x, edge.end.x);
    const zMin = isFront ? frontZ : rearZ - exteriorThickness;
    const zMax = isFront ? frontZ + exteriorThickness : rearZ;
    const openings = isFront ? facadeOpenings.front : facadeOpenings.rear;
    segments.push(...buildFacadeSegments(xMin, xMax, zMin, zMax, openings));
    return;
  }

  const dx = edge.end.x - edge.start.x;
  const dz = edge.end.z - edge.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length === 0) {
    return;
  }

  const inwardNormal: [number, number] = [
    -(dz / length),
    dx / length,
  ];

  segments.push(createOrientedWallSegment(edge, wallHeight, exteriorThickness, inwardNormal));
});

export const wallsGround = {
  segments,
};
