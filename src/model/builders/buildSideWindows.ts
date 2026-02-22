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
import { worldSideFromOutward, type FacadeContext } from './facadeContext';

export type BuildSideWindowsConfig = {
  ctx: FacadeContext;
  placements: FacadeWindowPlacement[];
};

function asMesh(meshSpec: WindowFactoryMesh) {
  const mesh = new THREE.Mesh(meshSpec.geometry, meshSpec.material);
  mesh.name = meshSpec.id;
  mesh.position.set(...meshSpec.position);
  if (import.meta.env.DEV) {
    console.log('SIDEWIN MESH POS', mesh.name, { x: mesh.position.x, z: mesh.position.z });
  }
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
    side: 'left' | 'right';
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
  const { spec, zCenter, xOuterPlane, height } = placement;

  // Interior direction is always opposite of outward
  const interiorDir = -ctx.outward;

  const xInnerReveal =
    xOuterPlane + interiorDir * (wallThickness.exterior ?? 0.3);

  const frameX =
    xOuterPlane - ctx.outward * (FRAME_DEPTH / 2);

  const glassX =
    frameX + interiorDir * GLASS_INSET;

  const worldSide = worldSideFromOutward(ctx.outward);

  const commonProps = {
    frameX,
    glassX,
    xFace: xOuterPlane,
    zCenter,
    side: worldSide,
  } as const;

  const fullHeight = Math.max(height, spec.firstY1 - spec.groundY0);
  const isFullHeightTall = spec.kind === 'tall' && fullHeight >= 4.8;

  if (isFullHeightTall) {
    const fullHeightSpec = levelBandSpec(spec, spec.groundY0, Math.max(spec.groundY1, spec.firstY1));
    meshes.push(...buildBandWindowMeshes(fullHeightSpec, commonProps));
    meshes.push(...createRevealMeshes({ spec: fullHeightSpec, zCenter, xOuter: xOuterPlane, xInner: xInnerReveal }));
    return meshes.map(asMesh);
  }

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
  console.log('CTX', ctx.facade, 'placements=', placements.length);

  const meshes: THREE.Object3D[] = [];
  console.log('BUILD SIDE WINDOWS CONTEXT', ctx.facade, 'outward=', ctx.outward);

  for (const placement of placements) {
    meshes.push(...buildSingleSideWindow(placement, ctx));
  }

  return meshes;
}
