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
import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import { worldSideFromOutward, type FacadeContext } from './facadeContext';
import { getWallPlanesAtZ } from './wallSurfaceResolver';

export type BuildSideWindowsConfig = {
  ctx: FacadeContext;
  placements: FacadeWindowPlacement[];
};

export type OpeningDescriptor = {
  xWall: number;
  zCenter: number;
  width: number;
  y0: number;
  y1: number;
  outward: number;
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
  const { spec, zCenter, height } = placement;
  const { xOuter: xFace, xInner: xInnerWall } = getWallPlanesAtZ(ctx.outward, zCenter, wallThickness.exterior ?? 0.3);
  const xOuterPlane = xFace - ctx.outward * FACADE_PANEL_PLANE_OFFSET;
  if (import.meta.env.DEV) {
    console.log('SIDEWIN XPLANE', {
      id: placement.spec.id,
      z: zCenter,
      xFace,
      xOuterPlane,
      outward: ctx.outward,
    });
  }

  // Interior direction is always opposite of outward
  const interiorDir = -ctx.outward;

  const xInnerReveal = xInnerWall - ctx.outward * FACADE_PANEL_PLANE_OFFSET;

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

export function buildSideWindows({ ctx, placements }: BuildSideWindowsConfig): {
  meshes: THREE.Object3D[];
  openings: OpeningDescriptor[];
} {
  console.log('CTX', ctx.facade, 'placements=', placements.length);

  const meshes: THREE.Object3D[] = [];
  const sideOpenings: OpeningDescriptor[] = [];
  console.log('BUILD SIDE WINDOWS CONTEXT', ctx.facade, 'outward=', ctx.outward);

  for (const placement of placements) {
    const { spec, zCenter, width } = placement;
    const { xOuter: xWall } = getWallPlanesAtZ(ctx.outward, zCenter, wallThickness.exterior ?? 0.3);
    const opening = {
      xWall,
      zCenter,
      width,
      y0: spec.groundY0,
      y1: spec.groundY1,
      outward: ctx.outward,
    };
    sideOpenings.push(opening);
    meshes.push(...buildSingleSideWindow(placement, ctx));
  }

  return { meshes, openings: sideOpenings };
}
