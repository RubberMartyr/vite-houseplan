import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedWallSegment } from '../deriveWalls';
import { resolveWallExtrusionDirection } from '../geom2d/wallExtrusionDirection';
import { archToWorldVec3 } from '../spaceMapping';

type WallPrismRanges = {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
};

type LocalCorner = {
  u: number;
  v: number;
  n: number;
};

function archVectorToWorld(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, -z);
}

function appendFace(
  positions: number[],
  uvs: number[],
  corners: readonly THREE.Vector3[],
  normalHint: THREE.Vector3,
  uSize: number,
  vSize: number
) {
  const baseIndex = positions.length / 3;

  corners.forEach((corner, index) => {
    positions.push(corner.x, corner.y, corner.z);

    const u = index % 2 === 0 ? 0 : uSize;
    const v = index < 2 ? 0 : vSize;
    uvs.push(u, v);
  });

  const edgeA = new THREE.Vector3().subVectors(corners[1], corners[0]);
  const edgeB = new THREE.Vector3().subVectors(corners[2], corners[0]);
  const winding = new THREE.Vector3().crossVectors(edgeA, edgeB).dot(normalHint);

  if (winding >= 0) {
    return [
      baseIndex + 0,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 3,
    ];
  }

  return [
    baseIndex + 0,
    baseIndex + 2,
    baseIndex + 1,
    baseIndex + 1,
    baseIndex + 2,
    baseIndex + 3,
  ];
}

export function buildWallPrismGeometry(
  wall: DerivedWallSegment,
  { uMin, uMax, vMin, vMax }: WallPrismRanges,
  brickScale = 0.6,
  footprintOuter?: Vec2[]
): THREE.BufferGeometry {
  const direction = resolveWallExtrusionDirection(wall, footprintOuter);

  if (!direction) {
    return new THREE.BufferGeometry();
  }

  const { tangent, outward, inward } = direction;
  const thickness = wall.thickness;
  const cornersLocal: LocalCorner[] = [
    { u: uMin, v: vMin, n: 0 },
    { u: uMax, v: vMin, n: 0 },
    { u: uMin, v: vMax, n: 0 },
    { u: uMax, v: vMax, n: 0 },
    { u: uMin, v: vMin, n: thickness },
    { u: uMax, v: vMin, n: thickness },
    { u: uMin, v: vMax, n: thickness },
    { u: uMax, v: vMax, n: thickness },
  ];

  const cornersWorld = cornersLocal.map(({ u, v, n }) =>
    archToWorldVec3(
      wall.start.x + tangent.x * u + inward.x * n,
      v,
      wall.start.z + tangent.z * u + inward.z * n
    )
  );

  const tangentWorld = new THREE.Vector3()
    .subVectors(cornersWorld[1], cornersWorld[0])
    .normalize();
  const outwardWorld = archVectorToWorld(outward.x, 0, outward.z).normalize();
  const inwardWorld = archVectorToWorld(inward.x, 0, inward.z).normalize();
  const upWorld = new THREE.Vector3(0, 1, 0);
  const downWorld = new THREE.Vector3(0, -1, 0);

  const length = uMax - uMin;
  const height = vMax - vMin;
  const depth = thickness;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const faceDefinitions = [
    {
      corners: [cornersWorld[0], cornersWorld[1], cornersWorld[2], cornersWorld[3]],
      normalHint: outwardWorld,
      uSize: length * brickScale,
      vSize: height * brickScale,
    },
    {
      corners: [cornersWorld[4], cornersWorld[5], cornersWorld[6], cornersWorld[7]],
      normalHint: inwardWorld,
      uSize: length * brickScale,
      vSize: height * brickScale,
    },
    {
      corners: [cornersWorld[0], cornersWorld[4], cornersWorld[2], cornersWorld[6]],
      normalHint: tangentWorld.clone().multiplyScalar(-1),
      uSize: depth * brickScale,
      vSize: height * brickScale,
    },
    {
      corners: [cornersWorld[1], cornersWorld[5], cornersWorld[3], cornersWorld[7]],
      normalHint: tangentWorld,
      uSize: depth * brickScale,
      vSize: height * brickScale,
    },
    {
      corners: [cornersWorld[2], cornersWorld[3], cornersWorld[6], cornersWorld[7]],
      normalHint: upWorld,
      uSize: length * brickScale,
      vSize: depth * brickScale,
    },
    {
      corners: [cornersWorld[0], cornersWorld[1], cornersWorld[4], cornersWorld[5]],
      normalHint: downWorld,
      uSize: length * brickScale,
      vSize: depth * brickScale,
    },
  ] as const;

  const geometry = new THREE.BufferGeometry();
  const isInterior = wall.kind === 'interior';

  faceDefinitions.forEach((face, faceIndex) => {
    const startIndex = indices.length;
    indices.push(
      ...appendFace(positions, uvs, face.corners, face.normalHint, face.uSize, face.vSize)
    );
    const count = indices.length - startIndex;
    const materialIndex =
      faceIndex === 0
        ? isInterior
          ? 1
          : 0
        : faceIndex === 1
          ? 1
          : isInterior
            ? 1
            : 2;
    geometry.addGroup(startIndex, count, materialIndex);
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
