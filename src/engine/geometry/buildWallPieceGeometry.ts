import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import { getWallVisibleBaseY } from '../deriveWalls';
import { resolveWallExtrusionDirection } from '../geom2d/wallExtrusionDirection';
import type { WallPieceRect } from '../openings/splitWallByOpenings';
import { archToWorldVec3 } from '../spaceMapping';

export function buildWallPieceGeometry(
  wall: DerivedWallSegment,
  piece: WallPieceRect,
  brickScale = 0.6,
  footprintOuter?: Vec2[]
): THREE.BufferGeometry {
  const direction = resolveWallExtrusionDirection(wall, footprintOuter);

  if (!direction) {
    return new THREE.BufferGeometry();
  }

  const { tangent, inward } = direction;
  const exteriorOffset = 0;
  const interiorOffset = wall.thickness;
  const wallBaseY = getWallVisibleBaseY(wall);

  const front = [
    [piece.uMin, piece.vMin, exteriorOffset],
    [piece.uMax, piece.vMin, exteriorOffset],
    [piece.uMin, piece.vMax, exteriorOffset],
    [piece.uMax, piece.vMax, exteriorOffset],
  ] as const;

  const back = [
    [piece.uMin, piece.vMin, interiorOffset],
    [piece.uMax, piece.vMin, interiorOffset],
    [piece.uMin, piece.vMax, interiorOffset],
    [piece.uMax, piece.vMax, interiorOffset],
  ] as const;

  const corners = [...front, ...back];
  const positions = new Float32Array(corners.length * 3);

  corners.forEach(([u, v, n], i) => {
    const archX = wall.start.x + tangent.x * u + inward.x * n;
    const archY = wallBaseY + v;
    const archZ = wall.start.z + tangent.z * u + inward.z * n;
    const world = archToWorldVec3(archX, archY, archZ);
    positions[i * 3 + 0] = world.x;
    positions[i * 3 + 1] = world.y;
    positions[i * 3 + 2] = world.z;
  });

  const indices = [
    0, 1, 2,
    2, 1, 3,
    4, 6, 5,
    5, 6, 7,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const wallStartWorld = archToWorldVec3(wall.start.x, wallBaseY, wall.start.z);
  const wallEndWorld = archToWorldVec3(wall.end.x, wallBaseY, wall.end.z);
  const worldDx = wallEndWorld.x - wallStartWorld.x;
  const worldDz = wallEndWorld.z - wallStartWorld.z;
  const worldLength = Math.hypot(worldDx, worldDz);
  const dirx = worldLength > 1e-9 ? worldDx / worldLength : 1;
  const dirz = worldLength > 1e-9 ? worldDz / worldLength : 0;
  const yBottom = wallStartWorld.y;

  const uv: number[] = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const u = (x * dirx + z * dirz) * brickScale;
    const v = (y - yBottom) * brickScale;

    uv.push(u, v);
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
