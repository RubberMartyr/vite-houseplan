import { ExtrudeGeometry, Mesh, MeshStandardMaterial, Path, Shape } from 'three';
import { offsetPolygonInward } from '../engine/geom2d/offsetPolygon';
import type { DerivedSlab } from '../engine/derive/deriveSlabs';
import { archToWorldXZ } from '../engine/spaceMapping';
import type { RenderStyleConfig } from './renderStyleConfig';

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
  const outer = offsetPolygonInward(slab.footprint.outer, slab.inset);
  addPolygonPath(shape, outer);

  (slab.footprint.holes ?? []).forEach((holePoints) => {
    const hole = new Path();
    addPolygonPath(hole, holePoints);
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
