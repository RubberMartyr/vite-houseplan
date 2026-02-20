import * as THREE from 'three';
import { levelHeights, wallThickness } from '../houseSpec';
import { FRAME_DEPTH, GLASS_INSET } from '../constants/windowConstants';
import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import {
  createRevealMeshes,
  makeSimpleWindow,
  makeSplitTallWindow,
  RIGHT_WORLD_FACADE_SEGMENTS,
  TALL_Z_OFFSET_TO_FRONT,
  type SideWindowSpec,
  type WindowFactoryMesh,
} from './windowFactory';

export type FacadeSide = 'left' | 'right';

export type BuildSideWindowsConfig = {
  facade: FacadeSide;
  specs: SideWindowSpec[];
};

function asMesh(meshSpec: WindowFactoryMesh) {
  const mesh = new THREE.Mesh(meshSpec.geometry, meshSpec.material);
  mesh.name = meshSpec.id;
  mesh.position.set(...meshSpec.position);
  mesh.rotation.set(...meshSpec.rotation);
  return mesh;
}

function getFacadeDirections(facade: FacadeSide) {
  if (facade === 'right') {
    return {
      outward: -1,
      interiorDir: 1,
      sillSide: 'left' as const,
    };
  }

  return {
    outward: 1,
    interiorDir: -1,
    sillSide: 'right' as const,
  };
}

function xFaceForRightWorldAtZ(z: number) {
  const segment =
    RIGHT_WORLD_FACADE_SEGMENTS.find((candidate) => z >= candidate.z0 && z <= candidate.z1) ??
    RIGHT_WORLD_FACADE_SEGMENTS[RIGHT_WORLD_FACADE_SEGMENTS.length - 1];

  return segment.x;
}

function xFaceForFacadeAtZ(facade: FacadeSide, z: number) {
  const x = xFaceForRightWorldAtZ(z);

  return facade === 'right' ? x : -x;
}

function levelBandSpec(spec: SideWindowSpec, y0: number, y1: number): SideWindowSpec {
  return {
    ...spec,
    groundY0: y0,
    groundY1: y1,
    firstY0: 0,
    firstY1: 0,
  };
}

function buildSingleSideWindow(
  spec: SideWindowSpec,
  facade: FacadeSide,
  outward: number,
  interiorDir: number,
  sillSide: 'left' | 'right',
): THREE.Object3D[] {
  const meshes: WindowFactoryMesh[] = [];

  let zCenter = spec.zCenter;
  if (spec.kind === 'tall') {
    zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
  }

  const xFace = xFaceForFacadeAtZ(facade, zCenter);
  const xOuterReveal = xFace - FACADE_PANEL_PLANE_OFFSET;
  const xInnerReveal = xOuterReveal + interiorDir * (wallThickness.exterior ?? 0.3);
  const xOuterPlane = xOuterReveal;

  const frameX = xOuterPlane - outward * (FRAME_DEPTH / 2);
  const glassX = frameX + interiorDir * GLASS_INSET;

  const commonProps = {
    frameX,
    glassX,
    xFace: xOuterPlane,
    zCenter,
    side: sillSide,
  } as const;

  if (spec.groundY1 > spec.groundY0) {
    const s = levelBandSpec(spec, spec.groundY0, spec.groundY1);
    meshes.push(
      ...(spec.kind === 'small'
        ? makeSimpleWindow({ ...commonProps, spec: s })
        : makeSplitTallWindow({ ...commonProps, spec: s, levelHeights })),
    );
    meshes.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterReveal, xInner: xInnerReveal }));
  }

  if (spec.firstY1 > spec.firstY0) {
    const s = levelBandSpec(spec, spec.firstY0, spec.firstY1);
    meshes.push(
      ...(spec.kind === 'small'
        ? makeSimpleWindow({ ...commonProps, spec: s })
        : makeSplitTallWindow({ ...commonProps, spec: s, levelHeights })),
    );
    meshes.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterReveal, xInner: xInnerReveal }));
  }

  return meshes.map(asMesh);
}

export function buildSideWindows({ facade, specs }: BuildSideWindowsConfig): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];
  const { outward, interiorDir, sillSide } = getFacadeDirections(facade);

  for (const spec of specs) {
    meshes.push(...buildSingleSideWindow(spec, facade, outward, interiorDir, sillSide));
  }

  return meshes;
}
