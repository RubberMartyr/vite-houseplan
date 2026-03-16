import { ExtrudeGeometry, Mesh, MeshStandardMaterial, Path, Shape } from 'three';
import type { DerivedSlab } from '../engine/derive/deriveSlabs';
import { archToWorldXZ } from '../engine/spaceMapping';
import type { RenderStyleConfig } from './renderStyleConfig';


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

function addPolygonPath(shape: Shape | Path, points: Array<{ x: number; z: number }>) {
  points.forEach((point, index) => {
    const mapped = archToWorldXZ(point);
    if (index === 0) {
      shape.moveTo(mapped.x, mapped.z);
    } else {
      shape.lineTo(mapped.x, mapped.z);
    }
  });
  shape.closePath();
}

export function buildSlabMesh(slab: DerivedSlab, renderConfig: RenderStyleConfig): Mesh {
  const shape = new Shape();
  const slabPolygon = ensureClosedPolygon(slab.footprint.outer);
  addPolygonPath(shape, slabPolygon);

  (slab.footprint.holes ?? []).forEach((holePoints) => {
    const hole = new Path();
    addPolygonPath(hole, ensureClosedPolygon(holePoints));
    shape.holes.push(hole);
  });

  const thickness = slab.elevationTop - slab.elevationBottom;
  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });

  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, slab.elevationTop, 0);
  geometry.computeVertexNormals();

  const material = new MeshStandardMaterial({ color: renderConfig.slabColor });
  const mesh = new Mesh(geometry, material);

  return mesh;
}
