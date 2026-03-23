import { DoubleSide, Mesh, MeshStandardMaterial, Path, Shape, ShapeGeometry } from 'three';
import type { SiteSpec, Vec2 } from '../architecturalTypes';
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

function signedArea(points: Vec2[]) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.z - next.x * current.z;
  }

  return area / 2;
}

function addPolygonPath(shape: Shape | Path, points: Array<{ x: number; z: number }>) {
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

export function buildSiteMesh(site: SiteSpec, cutouts: Vec2[][] = []): Mesh {
  const shape = new Shape();
  addPolygonPath(shape, ensureClosedPolygon(site.footprint.outer));

  const footprintHoles = site.footprint.holes ?? [];
  [...footprintHoles, ...cutouts].forEach((holePoints) => {
    const closedHole = ensureClosedPolygon(holePoints);
    const normalizedHole = signedArea(closedHole) > 0 ? [...closedHole].reverse() : closedHole;
    const hole = new Path();
    addPolygonPath(hole, normalizedHole);
    shape.holes.push(hole);
  });

  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, site.elevation ?? -0.001, 0);
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({
    color: '#6DAA2C',
    roughness: 0.9,
    metalness: 0,
    side: DoubleSide,
  });

  return new Mesh(geometry, material);
}
