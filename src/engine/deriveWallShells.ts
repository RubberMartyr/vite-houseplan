import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";

export type DerivedWallShell = {
  id: string;
  levelId: string;
  geometry: THREE.BufferGeometry;
};

function shapeFromOuterWithInnerHole(
  outer: { x: number; z: number }[],
  inner: { x: number; z: number }[]
) {
  const s = new THREE.Shape();
  outer.forEach((p, i) => (i === 0 ? s.moveTo(p.x, p.z) : s.lineTo(p.x, p.z)));
  s.closePath();

  const hole = new THREE.Path();
  inner.forEach((p, i) =>
    i === 0 ? hole.moveTo(p.x, p.z) : hole.lineTo(p.x, p.z)
  );
  hole.closePath();

  s.holes.push(hole);
  return s;
}

export function deriveWallShellsFromLevels(
  arch: ArchitecturalHouse
): DerivedWallShell[] {
  const shells: DerivedWallShell[] = [];

  for (const level of arch.levels) {
    const outer = level.footprint.outer;
    const half = arch.wallThickness / 2;
    const innerFace = offsetPolygonInward(outer, half);
    const outerFace = offsetPolygonInward(outer, -half);

    const wallShape = shapeFromOuterWithInnerHole(outerFace, innerFace);

    const geom = new THREE.ExtrudeGeometry(wallShape, {
      depth: level.height,
      bevelEnabled: false,
    });

    geom.rotateX(-Math.PI / 2);
    geom.translate(0, level.elevation, 0);
    geom.computeVertexNormals();

    shells.push({
      id: `wall-shell-${level.id}`,
      levelId: level.id,
      geometry: geom,
    });
  }

  return shells;
}
