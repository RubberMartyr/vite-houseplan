import * as THREE from "three";
import { buildRoofGeometry } from "../geometry/buildRoofGeometry";
import { archToWorldXZ } from "../spaceMapping";
import type { RoofTriangle } from "./types";

export function buildRoofFaceGeometry(
  triangles: RoofTriangle[],
  options: {
    topHeight: number;
    bottomHeight: number;
  },
): THREE.BufferGeometry {
  const points = triangles.flat();
  const top = points.map((point) => archToWorldXZ(point)).map((point) => [point.x, options.topHeight, point.z]);
  const bottom = points.map((point) => archToWorldXZ(point)).map((point) => [point.x, options.bottomHeight, point.z]);

  const positions = new Float32Array([...top.flat(), ...bottom.flat()]);
  const indices: number[] = [];
  for (let i = 0; i < points.length; i += 3) {
    indices.push(i + 2, i + 1, i);
  }
  const offset = points.length;
  for (let i = 0; i < points.length; i += 3) {
    indices.push(offset + i, offset + i + 1, offset + i + 2);
  }

  const geometry = buildRoofGeometry(positions, indices);
  geometry.computeVertexNormals();
  return geometry;
}
