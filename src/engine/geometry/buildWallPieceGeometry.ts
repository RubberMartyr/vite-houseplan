import * as THREE from 'three';
import type { DerivedWallSegment } from '../deriveWalls';
import { archToWorldVec3 } from '../spaceMapping';
import type { WallPieceRect } from '../openings/splitWallByOpenings';

export function buildWallPieceGeometry(
  wall: DerivedWallSegment,
  piece: WallPieceRect
): THREE.BufferGeometry {
  const wallDx = wall.end.x - wall.start.x;
  const wallDz = wall.end.z - wall.start.z;
  const length = Math.hypot(wallDx, wallDz);

  if (length <= 1e-9) {
    return new THREE.BufferGeometry();
  }

  const tx = wallDx / length;
  const tz = wallDz / length;
  const nx = -tz * wall.outwardSign;
  const nz = tx * wall.outwardSign;
  const halfT = wall.thickness / 2;

  const corners = [
    [piece.uMin, piece.vMin, +halfT],
    [piece.uMin, piece.vMin, -halfT],
    [piece.uMax, piece.vMin, +halfT],
    [piece.uMax, piece.vMin, -halfT],
    [piece.uMin, piece.vMax, +halfT],
    [piece.uMin, piece.vMax, -halfT],
    [piece.uMax, piece.vMax, +halfT],
    [piece.uMax, piece.vMax, -halfT],
  ] as const;

  const positions = new Float32Array(corners.length * 3);

  corners.forEach(([u, v, n], i) => {
    const archX = wall.start.x + tx * u + nx * n;
    const archY = wall.start.y + v;
    const archZ = wall.start.z + tz * u + nz * n;
    const world = archToWorldVec3(archX, archY, archZ);
    positions[i * 3 + 0] = world.x;
    positions[i * 3 + 1] = world.y;
    positions[i * 3 + 2] = world.z;
  });

  const indices = [
    0, 2, 1, 1, 2, 3,
    4, 5, 6, 5, 7, 6,
    0, 1, 4, 1, 5, 4,
    2, 6, 3, 3, 6, 7,
    1, 3, 5, 3, 7, 5,
    0, 4, 2, 2, 4, 6,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const wallStartWorld = archToWorldVec3(wall.start.x, wall.start.y, wall.start.z);
  const wallEndWorld = archToWorldVec3(wall.end.x, wall.start.y, wall.end.z);
  const worldDx = wallEndWorld.x - wallStartWorld.x;
  const worldDz = wallEndWorld.z - wallStartWorld.z;
  const worldLength = Math.hypot(worldDx, worldDz);
  const dirx = worldLength > 1e-9 ? worldDx / worldLength : 1;
  const dirz = worldLength > 1e-9 ? worldDz / worldLength : 0;
  const yBottom = wallStartWorld.y;

  const brickScale = 0.6;
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
  // Recompute normals after wall attributes/index are configured to reduce seam lighting.
  geometry.computeVertexNormals();
  return geometry;
}
