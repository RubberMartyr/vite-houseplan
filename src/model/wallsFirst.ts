import { BoxGeometry } from 'three';
import { getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, originOffset, wallThickness } from './houseSpec';

type WallSegment = {
  position: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;

const outline = getEnvelopeOuterPolygon();
const segments: WallSegment[] = outline
  .map((start, index) => {
    const end = outline[(index + 1) % outline.length];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    if (length === 0) {
      return null;
    }

    const midpoint: [number, number, number] = [
      (start.x + end.x) / 2,
      wallHeight / 2,
      (start.z + end.z) / 2,
    ];

    const inwardNormal: [number, number] = [-(dz / length), dx / length];
    const centerOffset: [number, number, number] = [
      (inwardNormal[0] * exteriorThickness) / 2,
      0,
      (inwardNormal[1] * exteriorThickness) / 2,
    ];

    const angle = Math.atan2(dz, dx);

    return {
      position: [
        midpoint[0] + centerOffset[0] + originOffset.x,
        midpoint[1],
        midpoint[2] + centerOffset[2] + originOffset.z,
      ],
      size: [length, wallHeight, exteriorThickness],
      rotation: [0, angle, 0],
      geometry: new BoxGeometry(length, wallHeight, exteriorThickness),
    };
  })
  .filter((segment): segment is WallSegment => Boolean(segment));

export const wallsFirst = {
  segments,
};
