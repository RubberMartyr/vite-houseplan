import { ceilingHeights, envelopeOutline, wallThickness } from './houseSpec';
import { BoxGeometry } from 'three';

type WallSegment = {
  position: [number, number, number];
  size: [number, number, number];
  rotation: [number, number, number];
  geometry: BoxGeometry;
};

type EnvelopeEdge = { start: { x: number; z: number }; end: { x: number; z: number } };

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;

function createOrientedWallSegment(
  edge: EnvelopeEdge,
  height: number,
  thickness: number
): WallSegment {
  const dx = edge.end.x - edge.start.x;
  const dz = edge.end.z - edge.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const midpoint: [number, number, number] = [
    (edge.start.x + edge.end.x) / 2,
    height / 2,
    (edge.start.z + edge.end.z) / 2,
  ];

  const inwardNormal: [number, number] = [-(dz / length), dx / length];
  const centerOffset: [number, number, number] = [
    (inwardNormal[0] * thickness) / 2,
    0,
    (inwardNormal[1] * thickness) / 2,
  ];

  const angle = Math.atan2(dz, dx);

  return {
    position: [midpoint[0] + centerOffset[0], midpoint[1], midpoint[2] + centerOffset[2]],
    size: [length, height, thickness],
    rotation: [0, angle, 0],
    geometry: new BoxGeometry(length, height, thickness),
  };
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
const segments: WallSegment[] = edges
  .map((edge) => {
    const dx = edge.end.x - edge.start.x;
    const dz = edge.end.z - edge.start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    return length === 0 ? null : createOrientedWallSegment(edge, wallHeight, exteriorThickness);
  })
  .filter((segment): segment is WallSegment => Boolean(segment));

export const wallsFirst = {
  segments,
};
