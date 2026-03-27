import * as THREE from 'three';
import { archToWorldVec3 } from '../spaceMapping';

type RoomPrismInput = {
  polygon: { x: number; z: number }[];
  baseY: number;
  height: number;
};

export function buildRoomPrismGeometry({
  polygon,
  baseY,
  height,
}: RoomPrismInput): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  if (polygon.length < 3 || height <= 0) {
    return geometry;
  }

  const positions: number[] = [];
  const indices: number[] = [];

  const bottom = polygon.map((point) => archToWorldVec3(point.x, baseY, point.z));
  const top = polygon.map((point) => archToWorldVec3(point.x, baseY + height, point.z));

  const pushVertex = (vertex: THREE.Vector3): number => {
    const index = positions.length / 3;
    positions.push(vertex.x, vertex.y, vertex.z);
    return index;
  };

  const bottomIndices = bottom.map(pushVertex);
  const topIndices = top.map(pushVertex);

  for (let i = 1; i < bottomIndices.length - 1; i += 1) {
    indices.push(bottomIndices[0], bottomIndices[i + 1], bottomIndices[i]);
  }

  for (let i = 1; i < topIndices.length - 1; i += 1) {
    indices.push(topIndices[0], topIndices[i], topIndices[i + 1]);
  }

  for (let i = 0; i < polygon.length; i += 1) {
    const next = (i + 1) % polygon.length;

    const b0 = bottomIndices[i];
    const b1 = bottomIndices[next];
    const t0 = topIndices[i];
    const t1 = topIndices[next];

    indices.push(b0, b1, t0);
    indices.push(t0, b1, t1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
