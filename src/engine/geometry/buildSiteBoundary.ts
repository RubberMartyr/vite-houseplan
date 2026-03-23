import * as THREE from 'three';
import type { SiteSpec } from '../architecturalTypes';
import { archToWorldVec3 } from '../spaceMapping';

function ensureClosedPolygon(points: Array<{ x: number; z: number }>) {
  if (points.length === 0) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (first.x === last.x && first.z === last.z) {
    return points;
  }

  return [...points, first];
}

export function buildSiteBoundaryPoints(site: SiteSpec, yOffset = 0.02): THREE.Vector3[] {
  return ensureClosedPolygon(site.footprint.outer).map((point) =>
    archToWorldVec3(point.x, (site.elevation ?? -0.001) + yOffset, point.z)
  );
}
