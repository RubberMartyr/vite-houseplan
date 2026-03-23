import * as THREE from "three";
import polygonClipping from "polygon-clipping";
import type { RoofSpec, XZ } from "./types";
import type { DerivedRoof } from "./derive/types/DerivedRoof";

function toPoly(points: XZ[]) {
  const ring = points[0] === points[points.length - 1] ? points : [...points, points[0]];
  return [ring.map((p) => [p.x, p.z])];
}

export function deriveFlatRoofGeometries(roofs: DerivedRoof[]): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  const footprintByLevelId = new Map<string, XZ[]>();

  for (const roof of roofs) {
    footprintByLevelId.set(roof.baseLevel.id, roof.footprintOuter);
  }

  for (const derivedRoof of roofs) {
    const roof = derivedRoof.spec as RoofSpec;

    if (roof.type !== "flat") continue;

    const basePoly = toPoly(derivedRoof.roofPolygonOuter);

    let result: any = basePoly;

    if (roof.subtractAboveLevelId) {
      const aboveFootprint = footprintByLevelId.get(roof.subtractAboveLevelId);
      if (aboveFootprint) {
        const abovePoly = toPoly(aboveFootprint);
        result = polygonClipping.difference(basePoly as any, abovePoly as any);
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

      // Flat roofs should bear directly on the top of the supporting walls.
      // Adding the level slab thickness lifts the roof above the wall cap and
      // creates an artificial shadow gap once roof-bearing slabs are hidden.
      geom.translate(
        0,
        derivedRoof.baseLevel.elevation + derivedRoof.baseLevel.height,
        0
      );

      geom.computeVertexNormals();

      geometries.push(geom);
    }
  }

  return geometries;
}
