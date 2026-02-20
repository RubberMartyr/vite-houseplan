import * as THREE from 'three';
import { levelHeights, wallThickness } from '../houseSpec';
import { FRAME_DEPTH, GLASS_INSET } from '../constants/windowConstants';
import {
  createRevealMeshes,
  makeSimpleWindow,
  makeSplitTallWindow,
  type SideWindowSpec,
  type WindowFactoryMesh,
} from './windowFactory';
import type { FacadeWindowPlacement } from '../types/FacadeWindowPlacement';
import type { FacadeContext } from './facadeContext';

export type BuildSideWindowsConfig = {
  ctx: FacadeContext;
  placements: FacadeWindowPlacement[];
};

function asMesh(meshSpec: WindowFactoryMesh) {
  const mesh = new THREE.Mesh(meshSpec.geometry, meshSpec.material);
  mesh.name = meshSpec.id;
  mesh.position.set(...meshSpec.position);
  mesh.rotation.set(...meshSpec.rotation);
  return mesh;
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

function buildBandWindowMeshes(
  spec: SideWindowSpec,
  commonProps: {
    frameX: number;
    glassX: number;
    xFace: number;
    zCenter: number;
    side: FacadeContext['sillSide'];
  },
): WindowFactoryMesh[] {
  const height = spec.groundY1 - spec.groundY0;
  const isFullHeightTall = spec.kind === 'tall' && height >= 4.8;

  return isFullHeightTall
    ? makeSplitTallWindow({ ...commonProps, spec, levelHeights })
    : makeSimpleWindow({ ...commonProps, spec });
}

function buildSingleSideWindow(
  placement: FacadeWindowPlacement,
  ctx: FacadeContext,
): THREE.Object3D[] {
  const meshes: WindowFactoryMesh[] = [];
  const { spec, zCenter, xOuterPlane } = placement;

  const xInnerReveal = xOuterPlane + ctx.interiorDir * (wallThickness.exterior ?? 0.3);

  const frameX = xOuterPlane - ctx.outward * (FRAME_DEPTH / 2);
  const glassX = frameX + ctx.interiorDir * GLASS_INSET;

  const commonProps = {
    frameX,
    glassX,
    xFace: xOuterPlane,
    zCenter,
    side: ctx.sillSide,
  } as const;

  if (spec.groundY1 > spec.groundY0) {
    const s = levelBandSpec(spec, spec.groundY0, spec.groundY1);
    meshes.push(...buildBandWindowMeshes(s, commonProps));
    meshes.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterPlane, xInner: xInnerReveal }));
  }

  if (spec.firstY1 > spec.firstY0) {
    const s = levelBandSpec(spec, spec.firstY0, spec.firstY1);
    meshes.push(...buildBandWindowMeshes(s, commonProps));
    meshes.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterPlane, xInner: xInnerReveal }));
  }

  return meshes.map(asMesh);
}

export function buildSideWindows({ ctx, placements }: BuildSideWindowsConfig): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];

  for (const placement of placements) {
    meshes.push(...buildSingleSideWindow(placement, ctx));
  }

  return meshes;
}
