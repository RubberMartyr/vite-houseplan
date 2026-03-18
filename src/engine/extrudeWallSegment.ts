import * as THREE from "three";
import type { Vec2 } from "./architecturalTypes";
import type { DerivedWallSegment } from "./deriveWalls";
import { getWallVisibleBaseY, getWallVisibleTopY } from "./deriveWalls";
import { resolveWallExtrusionDirection } from "./geom2d/wallExtrusionDirection";
import { archToWorldVec3 } from "./spaceMapping";

export function extrudeWallSegment(
  seg: DerivedWallSegment,
  brickScale = 0.6,
  footprintOuter?: Vec2[]
): THREE.BufferGeometry {
  const direction = resolveWallExtrusionDirection(seg, footprintOuter);

  if (!direction) {
    return new THREE.BufferGeometry();
  }

  const { length, tangent, inward } = direction;
  const yBottom = getWallVisibleBaseY(seg);
  const yTop = getWallVisibleTopY(seg);
  const exteriorOffset = 0;
  const interiorOffset = seg.thickness;

  const corners = [
    [0, yBottom, exteriorOffset],
    [length, yBottom, exteriorOffset],
    [0, yTop, exteriorOffset],
    [length, yTop, exteriorOffset],
    [0, yBottom, interiorOffset],
    [length, yBottom, interiorOffset],
    [0, yTop, interiorOffset],
    [length, yTop, interiorOffset],
  ] as const;

  const positions = new Float32Array(corners.length * 3);

  corners.forEach(([u, y, n], i) => {
    const archX = seg.start.x + tangent.x * u + inward.x * n;
    const archZ = seg.start.z + tangent.z * u + inward.z * n;
    const world = archToWorldVec3(archX, y, archZ);
    positions[i * 3 + 0] = world.x;
    positions[i * 3 + 1] = world.y;
    positions[i * 3 + 2] = world.z;
  });

  const uv: number[] = [];
  const wallStartWorld = archToWorldVec3(seg.start.x, yBottom, seg.start.z);
  const wallEndWorld = archToWorldVec3(seg.end.x, yBottom, seg.end.z);
  const worldDx = wallEndWorld.x - wallStartWorld.x;
  const worldDz = wallEndWorld.z - wallStartWorld.z;
  const worldLength = Math.hypot(worldDx, worldDz);
  const dirx = worldLength > 1e-9 ? worldDx / worldLength : 1;
  const dirz = worldLength > 1e-9 ? worldDz / worldLength : 0;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const u = (x * dirx + z * dirz) * brickScale;
    const v = (y - yBottom) * brickScale;

    uv.push(u, v);
  }

  const indices = [
    0, 1, 2,
    2, 1, 3,
    4, 6, 5,
    5, 6, 7,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
