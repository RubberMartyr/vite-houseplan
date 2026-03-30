import * as THREE from 'three';
import { archToWorldVec3 } from '../spaceMapping';

type RoomPrismInput = {
  polygon: { x: number; z: number }[];
  baseY: number;
  height: number;
};

const EPSILON = 1e-9;

function polygonSignedAreaXZ(points: { x: number; z: number }[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.z - b.x * a.z;
  }
  return area * 0.5;
}

function orient2d(a: { x: number; z: number }, b: { x: number; z: number }, c: { x: number; z: number }): number {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

function onSegment(a: { x: number; z: number }, b: { x: number; z: number }, p: { x: number; z: number }): boolean {
  return (
    p.x >= Math.min(a.x, b.x) - EPSILON &&
    p.x <= Math.max(a.x, b.x) + EPSILON &&
    p.z >= Math.min(a.z, b.z) - EPSILON &&
    p.z <= Math.max(a.z, b.z) + EPSILON &&
    Math.abs(orient2d(a, b, p)) <= EPSILON
  );
}

function segmentsIntersect(
  a1: { x: number; z: number },
  a2: { x: number; z: number },
  b1: { x: number; z: number },
  b2: { x: number; z: number }
): boolean {
  const o1 = orient2d(a1, a2, b1);
  const o2 = orient2d(a1, a2, b2);
  const o3 = orient2d(b1, b2, a1);
  const o4 = orient2d(b1, b2, a2);

  if (Math.abs(o1) <= EPSILON && onSegment(a1, a2, b1)) return true;
  if (Math.abs(o2) <= EPSILON && onSegment(a1, a2, b2)) return true;
  if (Math.abs(o3) <= EPSILON && onSegment(b1, b2, a1)) return true;
  if (Math.abs(o4) <= EPSILON && onSegment(b1, b2, a2)) return true;

  return (o1 > EPSILON) !== (o2 > EPSILON) && (o3 > EPSILON) !== (o4 > EPSILON);
}

function isSelfIntersectingSimpleRing(points: { x: number; z: number }[]): boolean {
  const n = points.length;
  if (n < 3) return true;

  for (let i = 0; i < n; i += 1) {
    const a1 = points[i];
    const a2 = points[(i + 1) % n];

    for (let j = i + 1; j < n; j += 1) {
      if (j === i) continue;
      if (j === (i + 1) % n) continue;
      if (i === (j + 1) % n) continue;

      const b1 = points[j];
      const b2 = points[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

export function buildRoomPrismGeometry({
  polygon,
  baseY,
  height,
}: RoomPrismInput): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  if (polygon.length < 3 || height <= 0) {
    return geometry;
  }

  if (Math.abs(polygonSignedAreaXZ(polygon)) <= EPSILON || isSelfIntersectingSimpleRing(polygon)) {
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

  const contour = polygon.map((point) => new THREE.Vector2(point.x, point.z));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

  if (triangles.length === 0) {
    return geometry;
  }

  for (const tri of triangles) {
    const [a, b, c] = tri;
    indices.push(bottomIndices[a], bottomIndices[c], bottomIndices[b]);
  }

  for (const tri of triangles) {
    const [a, b, c] = tri;
    indices.push(topIndices[a], topIndices[b], topIndices[c]);
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
