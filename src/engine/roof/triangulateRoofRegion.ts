import * as THREE from "three";
import type { RoofRegion, RoofTriangle } from "./types";

export function triangulateRoofRegion(region: RoofRegion): RoofTriangle[] {
  const contour = region.points.slice(0, -1).map((point) => new THREE.Vector2(point.x, point.z));
  const indices = THREE.ShapeUtils.triangulateShape(contour, []);
  return indices.map(([a, b, c]) => [region.points[a], region.points[b], region.points[c]]);
}
