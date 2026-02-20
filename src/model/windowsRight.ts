import * as THREE from 'three';
import { ARCH_SIDE_TO_WORLD_X, wallThickness } from './houseSpec';
import { EPS, FRAME_DEPTH, GLASS_INSET } from './constants/windowConstants';
import { createRevealMeshes, makeSimpleWindow, makeSplitTallWindow, type WindowFactoryMesh, type WindowFactorySpec } from './builders/windowFactory';

export type SideWindowMesh = {
  id: string;
  meshes: THREE.Object3D[];
};

type SideWindowSpec = WindowFactorySpec & {
  zCenter: number;
  archSide: 'RIGHT';
};

export const ARCH_RIGHT_FACADE_SEGMENTS = [
  { id: 'R_A', z0: 0.0, z1: 4.0, x: -4.8 },
  { id: 'R_B', z0: 4.0, z1: 8.45, x: -4.1 },
  { id: 'R_C', z0: 8.45, z1: 12.0, x: -3.5 },
] as const;

function xFaceForArchSideAtZ(z: number) {
  const segment = ARCH_RIGHT_FACADE_SEGMENTS.find((candidate) => z >= candidate.z0 && z <= candidate.z1)
    ?? ARCH_RIGHT_FACADE_SEGMENTS[ARCH_RIGHT_FACADE_SEGMENTS.length - 1];

  return segment.x;
}

const rightSideWindowSpecs: SideWindowSpec[] = [
  {
    id: 'SIDE_R_DOOR',
    kind: 'small',
    archSide: 'RIGHT',
    zCenter: 5.5,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0.0,
    firstY1: 0.0,
  },
  {
    id: 'SIDE_R_WIN',
    kind: 'tall',
    archSide: 'RIGHT',
    zCenter: 5.5,
    width: 0.9,
    groundY0: 4.1,
    groundY1: 4.1,
    firstY0: 4.1,
    firstY1: 5.0,
  },
];

function asMesh(meshSpec: WindowFactoryMesh) {
  const mesh = new THREE.Mesh(meshSpec.geometry, meshSpec.material);
  mesh.name = meshSpec.id;
  mesh.position.set(...meshSpec.position);
  mesh.rotation.set(...meshSpec.rotation);
  return mesh;
}

const meshes: SideWindowMesh[] = rightSideWindowSpecs.map((spec) => {
  const zCenter = spec.zCenter;
  const xFace = xFaceForArchSideAtZ(zCenter);
  const outward = ARCH_SIDE_TO_WORLD_X[spec.archSide];
  const interiorDir = -outward;
  const wallDepth = wallThickness.exterior ?? 0.3;

  const xOuterReveal = xFace;
  const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
  const xOuterPlane = xOuterReveal + outward * EPS;
  const frameX = xOuterPlane - outward * (FRAME_DEPTH / 2);
  const glassX = frameX + interiorDir * GLASS_INSET;

  const commonProps = {
    spec,
    frameX,
    glassX,
    xFace: xOuterPlane,
    zCenter,
    side: 'left' as const,
  };

  const windowMeshes =
    spec.kind === 'small'
      ? makeSimpleWindow(commonProps)
      : makeSplitTallWindow({ ...commonProps, levelHeights: { firstFloor: 4.1 } });

  const revealMeshes = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  return { id: spec.id, meshes: [...windowMeshes, ...revealMeshes].map(asMesh) };
});

export const windowsRight = { meshes };
