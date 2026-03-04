import * as THREE from 'three';
import { levelHeights, wallThickness } from '../houseSpec';
import { EPS, FRAME_DEPTH, GLASS_INSET } from '../constants/windowConstants';
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
import { debugWallIntersectionsAtZ, getWallPlanesAtZ } from './wallSurfaceResolver';
import { runtimeFlags } from '../runtimeFlags';

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

const isWindowDebugEnabled = () => runtimeFlags.debugWindows || import.meta.env.DEV;

function createWallPlaneDebugLine(params: {
  xWallPlane: number;
  zCenter: number;
  yMid: number;
}): THREE.Line {
  const { xWallPlane, zCenter, yMid } = params;
  const halfLen = 0.25;
  const points = [
    new THREE.Vector3(xWallPlane, yMid, zCenter - halfLen),
    new THREE.Vector3(xWallPlane, yMid, zCenter + halfLen),
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const line = new THREE.Line(geometry, material);
  line.name = `debug_wall_plane_z_${zCenter.toFixed(2)}`;
  return line;
}

function snapWindowToRightWallPlane(params: {
  facade: FacadeContext['facade'];
  zCenter: number;
  outwardSign: 1 | -1;
  frameDepth: number;
  eps: number;
}) {
  const { facade, zCenter, outwardSign, frameDepth, eps } = params;
  if (isWindowDebugEnabled()) {
    console.log('[SIDE WINDOW SNAP] zCenter:', zCenter);
  }

  const { xOuter } = getWallPlanesAtZ(
    outwardSign,
    zCenter,
    wallThickness.exterior,
  );

  // Snap window center directly to wall plane.
  const outwardSignForSnap = facade === 'architecturalRight' ? -outwardSign : outwardSign;
  const x = xOuter + outwardSignForSnap * (frameDepth / 2 - eps);

  return { x, xOuter };
}

function asMesh(meshSpec: WindowFactoryMesh) {
  const mesh = new THREE.Mesh(meshSpec.geometry, meshSpec.material);
  mesh.name = meshSpec.id;
  mesh.position.set(...meshSpec.position);
  mesh.rotation.set(...meshSpec.rotation);

  if (isWindowDebugEnabled()) {
    console.log('[MESH CREATED] name:', mesh.name);
    console.log('[MESH CREATED] position:', mesh.position.toArray());
    console.log('[MESH CREATED] rotation:', mesh.rotation.toArray());
    console.log('[MESH CREATED] parent:', mesh.parent?.name ?? null);
  }

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

function rotateMeshesToWallTangent(params: {
  meshes: THREE.Object3D[];
  tangentXZ: { x: number; z: number };
  anchorX: number;
  anchorZ: number;
}) {
  const { meshes, tangentXZ, anchorX, anchorZ } = params;
  const theta = Math.atan2(tangentXZ.x, tangentXZ.z);

  if (Math.abs(theta) < 1e-6) return;

  const anchor = new THREE.Vector3(anchorX, 0, anchorZ);
  const axis = new THREE.Vector3(0, 1, 0);

  for (const mesh of meshes) {
    mesh.position.sub(anchor);
    mesh.position.applyAxisAngle(axis, theta);
    mesh.position.add(anchor);
    mesh.rotateOnAxis(axis, theta);
  }
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
  const { xOuter: xFace, xInner: xInnerWall, tangentXZ } = getWallPlanesAtZ(
    ctx.outward,
    zCenter,
    wallThickness.exterior ?? 0.3,
  );
  const xOuterPlane = xFace - ctx.outward * FACADE_PANEL_PLANE_OFFSET;
  if (isWindowDebugEnabled()) {
    console.log('[SIDE WINDOW BUILD] id:', placement.spec.id);
    console.log('[SIDE WINDOW BUILD] zCenter:', zCenter);
    console.log('[SIDE WINDOW BUILD] width:', placement.width);
    console.log('[SIDE WINDOW BUILD] wallFaceX:', xFace);
    console.log('[SIDE WINDOW BUILD] xInnerWall:', xInnerWall);
    console.log('[SIDE WINDOW BUILD] ctx.facade:', ctx.facade);
    console.log('[SIDE WINDOW BUILD] ctx.outward:', ctx.outward);
  }

  // Interior direction is always opposite of outward
  const interiorDir = -ctx.outward;

  const xInnerReveal = xInnerWall - ctx.outward * FACADE_PANEL_PLANE_OFFSET;

  if (runtimeFlags.debugWindows) {
    debugWallIntersectionsAtZ(zCenter);
  }

  const { x: frameX, xOuter } = snapWindowToRightWallPlane({
    facade: ctx.facade,
    zCenter,
    outwardSign: ctx.outward as 1 | -1,
    frameDepth: FRAME_DEPTH,
    eps: EPS,
  });

  const glassX =
    frameX + interiorDir * GLASS_INSET;

  if (isWindowDebugEnabled()) {
    console.log('[SIDE WINDOW BUILD] resolvedWallOuterX:', xOuter);
    console.log('[SIDE WINDOW BUILD] frameX:', frameX);
    console.log('[SIDE WINDOW BUILD] glassX:', glassX);
  }

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
    const builtMeshes = meshes.map(asMesh);
    if (isWindowDebugEnabled() && ctx.facade === 'architecturalRight') {
      builtMeshes.forEach((mesh) => {
        console.log('[SIDE WINDOW BUILD] right window world pos:', mesh.position.toArray());
      });
    }
    rotateMeshesToWallTangent({
      meshes: builtMeshes,
      tangentXZ,
      anchorX: xFace,
      anchorZ: zCenter,
    });
    return builtMeshes;
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

  const builtMeshes = meshes.map(asMesh);
  if (isWindowDebugEnabled() && ctx.facade === 'architecturalRight') {
    builtMeshes.forEach((mesh) => {
      console.log('[SIDE WINDOW BUILD] right window world pos:', mesh.position.toArray());
    });
  }

  rotateMeshesToWallTangent({
    meshes: builtMeshes,
    tangentXZ,
    anchorX: xFace,
    anchorZ: zCenter,
  });

  return builtMeshes;
}

export function buildSideWindows({ ctx, placements }: BuildSideWindowsConfig): {
  meshes: THREE.Object3D[];
  openings: OpeningDescriptor[];
} {
  if (isWindowDebugEnabled()) {
    console.log('CTX', ctx.facade, 'placements=', placements.length);
  }

  const meshes: THREE.Object3D[] = [];
  const sideOpenings: OpeningDescriptor[] = [];
  if (isWindowDebugEnabled()) {
    console.log('BUILD SIDE WINDOWS CONTEXT', ctx.facade, 'outward=', ctx.outward);
  }

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

    if (isWindowDebugEnabled()) {
      const yMid = spec.groundY0 + placement.height / 2;
      meshes.push(createWallPlaneDebugLine({ xWallPlane: xWall, zCenter, yMid }));
    }
  }

  return { meshes, openings: sideOpenings };
}
