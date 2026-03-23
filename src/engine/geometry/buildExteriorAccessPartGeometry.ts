import * as THREE from 'three';

type PrismFaceDefinition = {
  corners: readonly THREE.Vector3[];
  normalHint: THREE.Vector3;
  uSize: number;
  vSize: number;
};

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

export function buildExteriorAccessPartGeometry(
  size: { x: number; y: number; z: number },
  textureScale = 1
): THREE.BufferGeometry {
  const halfX = size.x / 2;
  const halfY = size.y / 2;
  const halfZ = size.z / 2;

  const corners = [
    new THREE.Vector3(-halfX, -halfY, -halfZ),
    new THREE.Vector3(halfX, -halfY, -halfZ),
    new THREE.Vector3(-halfX, halfY, -halfZ),
    new THREE.Vector3(halfX, halfY, -halfZ),
    new THREE.Vector3(-halfX, -halfY, halfZ),
    new THREE.Vector3(halfX, -halfY, halfZ),
    new THREE.Vector3(-halfX, halfY, halfZ),
    new THREE.Vector3(halfX, halfY, halfZ),
  ] as const;

  const right = new THREE.Vector3(1, 0, 0);
  const left = new THREE.Vector3(-1, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const down = new THREE.Vector3(0, -1, 0);
  const front = new THREE.Vector3(0, 0, 1);
  const back = new THREE.Vector3(0, 0, -1);

  const faceDefinitions: PrismFaceDefinition[] = [
    {
      corners: [corners[0], corners[1], corners[2], corners[3]],
      normalHint: back,
      uSize: size.x * textureScale,
      vSize: size.y * textureScale,
    },
    {
      corners: [corners[4], corners[5], corners[6], corners[7]],
      normalHint: front,
      uSize: size.x * textureScale,
      vSize: size.y * textureScale,
    },
    {
      corners: [corners[0], corners[4], corners[2], corners[6]],
      normalHint: left,
      uSize: size.z * textureScale,
      vSize: size.y * textureScale,
    },
    {
      corners: [corners[1], corners[5], corners[3], corners[7]],
      normalHint: right,
      uSize: size.z * textureScale,
      vSize: size.y * textureScale,
    },
    {
      corners: [corners[2], corners[3], corners[6], corners[7]],
      normalHint: up,
      uSize: size.x * textureScale,
      vSize: size.z * textureScale,
    },
    {
      corners: [corners[0], corners[1], corners[4], corners[5]],
      normalHint: down,
      uSize: size.x * textureScale,
      vSize: size.z * textureScale,
    },
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  faceDefinitions.forEach((face) => {
    indices.push(
      ...appendFace(positions, uvs, face.corners, face.normalHint, face.uSize, face.vSize)
    );
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
