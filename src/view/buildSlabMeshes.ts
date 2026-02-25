import { Mesh, MeshStandardMaterial, Shape, ShapeGeometry } from 'three';
import { offsetPolygonInward } from '../engine/geom2d/offsetPolygon';
import type { DerivedSlab } from '../engine/derive/deriveSlabs';
import type { RenderStyleConfig } from './renderStyleConfig';

export function buildSlabMesh(slab: DerivedSlab, renderConfig: RenderStyleConfig): Mesh {
  const shape = new Shape();
  const points = offsetPolygonInward(slab.footprint.outer, slab.inset);

  points.forEach((point, index) => {
    if (index === 0) {
      shape.moveTo(point.x, point.z);
    } else {
      shape.lineTo(point.x, point.z);
    }
  });

  shape.closePath();

  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({ color: renderConfig.slabColor });
  const mesh = new Mesh(geometry, material);
  mesh.position.y = slab.elevationTop;

  return mesh;
}
