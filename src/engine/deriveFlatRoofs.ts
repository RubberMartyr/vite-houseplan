import * as THREE from "three";
import polygonClipping from "polygon-clipping";
import type { ArchitecturalHouse } from "./architecturalTypes";

function toPoly(points: { x: number; z: number }[]) {
  return [points.map((p) => [p.x, p.z])];
}

export function deriveFlatRoofGeometries(
  arch: ArchitecturalHouse
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs) {
    if (roof.type !== "flat") continue;

    const baseLevel = arch.levels.find(
      (l) => l.id === roof.baseLevelId
    );
    if (!baseLevel) continue;

    const basePoly = toPoly(baseLevel.footprint.outer);

    let result: any = basePoly;

    if (roof.subtractAboveLevelId) {
      const aboveLevel = arch.levels.find(
        (l) => l.id === roof.subtractAboveLevelId
      );
      if (aboveLevel) {
        const abovePoly = toPoly(aboveLevel.footprint.outer);
        result = polygonClipping.difference(basePoly, abovePoly);
      }
    }

    for (const polygon of result as any[]) {
      const outerRing = polygon[0] as number[][];

      const shape = new THREE.Shape();
      outerRing.forEach((pt: number[], i: number) => {
        if (i === 0) shape.moveTo(pt[0], pt[1]);
        else shape.lineTo(pt[0], pt[1]);
      });
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: roof.thickness,
        bevelEnabled: false,
      });

      geom.rotateX(-Math.PI / 2);

      geom.translate(
        0,
        baseLevel.elevation + baseLevel.height,
        0
      );

      geom.computeVertexNormals();

      geometries.push(geom);
    }
  }

  return geometries;
}
