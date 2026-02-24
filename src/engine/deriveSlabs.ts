import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";

export type DerivedSlab = {
  id: string;
  geometry: THREE.BufferGeometry;
};

export function deriveSlabsFromLevels(
  arch: ArchitecturalHouse
): DerivedSlab[] {
  const slabs: DerivedSlab[] = [];

  for (const level of arch.levels) {
    const shape = new THREE.Shape();
    const outer = level.footprint.outer;

    outer.forEach((pt, i) => {
      if (i === 0) {
        shape.moveTo(pt.x, pt.z);
      } else {
        shape.lineTo(pt.x, pt.z);
      }
    });

    shape.closePath();

    if (level.footprint.holes?.length) {
      for (const hole of level.footprint.holes) {
        if (!hole.length) {
          continue;
        }

        const path = new THREE.Path();
        hole.forEach((pt, i) => {
          if (i === 0) {
            path.moveTo(pt.x, pt.z);
          } else {
            path.lineTo(pt.x, pt.z);
          }
        });
        path.closePath();
        shape.holes.push(path);
      }
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: level.slabThickness,
      bevelEnabled: false,
    });

    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, level.elevation - level.slabThickness, 0);

    slabs.push({
      id: `slab-${level.id}`,
      geometry,
    });
  }

  return slabs;
}
