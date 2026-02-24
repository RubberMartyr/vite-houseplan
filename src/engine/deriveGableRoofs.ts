import * as THREE from "three";
import type { ArchitecturalHouse } from "./architecturalTypes";
import { offsetPolygonInward } from "./geom2d/offsetPolygon";

export function deriveGableRoofGeometries(
  arch: ArchitecturalHouse
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const roof of arch.roofs) {
    if (roof.type !== "gable") continue;

    const baseLevel = arch.levels.find(
      (l) => l.id === roof.baseLevelId
    );
    if (!baseLevel) continue;

    const slopeRad = (roof.slopeDeg * Math.PI) / 180;
    const baseElevation = baseLevel.elevation + baseLevel.height;

    let footprint = baseLevel.footprint.outer;

    if (roof.overhang && roof.overhang !== 0) {
      footprint = offsetPolygonInward(footprint, -roof.overhang);
    }

    const xs = footprint.map((p) => p.x);
    const zs = footprint.map((p) => p.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    let ridgeHeight = 0;
    let geometry: THREE.BufferGeometry;

    if (roof.ridgeDirection === "x") {
      const depth = maxZ - minZ;
      ridgeHeight = Math.tan(slopeRad) * (depth / 2);

      const shape = new THREE.Shape();
      footprint.forEach((p, i) => {
        if (i === 0) shape.moveTo(p.x, p.z);
        else shape.lineTo(p.x, p.z);
      });
      shape.closePath();

      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: ridgeHeight,
        bevelEnabled: false,
      });

      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        const localZ = z - (minZ + depth / 2);
        const height = ridgeHeight - Math.abs(localZ) * Math.tan(slopeRad);
        pos.setY(i, baseElevation + height);
      }

      pos.needsUpdate = true;
    } else {
      const width = maxX - minX;
      ridgeHeight = Math.tan(slopeRad) * (width / 2);

      const shape = new THREE.Shape();
      footprint.forEach((p, i) => {
        if (i === 0) shape.moveTo(p.x, p.z);
        else shape.lineTo(p.x, p.z);
      });
      shape.closePath();

      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: ridgeHeight,
        bevelEnabled: false,
      });

      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const localX = x - (minX + width / 2);
        const height = ridgeHeight - Math.abs(localX) * Math.tan(slopeRad);
        pos.setY(i, baseElevation + height);
      }

      pos.needsUpdate = true;
    }

    geometry.computeVertexNormals();
    geometries.push(geometry);
  }

  return geometries;
}
