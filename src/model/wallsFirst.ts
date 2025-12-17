import { ceilingHeights, frontZ, leftX, rearZ, rightX, wallThickness } from './houseSpec';
import { BoxGeometry } from 'three';

type WallSegment = {
  position: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;

function createWallSegment(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  height: number
): WallSegment {
  return {
    position: [
      (xMin + xMax) / 2,
      height / 2,
      (zMin + zMax) / 2,
    ],
    size: [xMax - xMin, height, zMax - zMin],
    rotation: [0, 0, 0],
    geometry: new BoxGeometry(xMax - xMin, height, zMax - zMin),
  };
}

const segments: WallSegment[] = [];

segments.push(createWallSegment(leftX, rightX, frontZ, frontZ + exteriorThickness, wallHeight));
segments.push(
  createWallSegment(leftX, rightX, rearZ - exteriorThickness, rearZ, wallHeight)
);
segments.push(createWallSegment(leftX, leftX + exteriorThickness, frontZ, rearZ, wallHeight));
segments.push(
  createWallSegment(rightX - exteriorThickness, rightX, frontZ, rearZ, wallHeight)
);

export const wallsFirst = {
  segments,
};
