import { DoubleSide, Mesh, MeshStandardMaterial, Shape, ShapeGeometry } from 'three';
import type { SiteSpec } from '../architecturalTypes';
import { archToWorldXZ } from '../spaceMapping';

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

function addPolygonPath(shape: Shape, points: Array<{ x: number; z: number }>) {
  points.forEach((point, index) => {
    const mapped = archToWorldXZ(point);
    if (index === 0) {
      shape.moveTo(mapped.x, mapped.z);
      return;
    }

    shape.lineTo(mapped.x, mapped.z);
  });
  shape.closePath();
}

export function buildSiteMesh(site: SiteSpec): Mesh {
  const shape = new Shape();
  addPolygonPath(shape, ensureClosedPolygon(site.footprint.outer));

  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, site.elevation ?? -0.001, 0);
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({
    color: site.color ?? '#d8d8d8',
    side: DoubleSide,
  });

  return new Mesh(geometry, material);
}
