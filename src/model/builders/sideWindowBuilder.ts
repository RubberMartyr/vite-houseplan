import * as THREE from 'three';
import { levelHeights, wallThickness } from '../houseSpec';
import { EPS, FRAME_DEPTH, GLASS_INSET } from '../constants/windowConstants';
import { FACADE_PANEL_PLANE_OFFSET } from '../constants/facadeConstants';
import { xFaceForProfileAtZ, type FacadeSegment } from './sideFacade';
import { createRevealMeshes, makeSimpleWindow, makeSplitTallWindow, type WindowFactoryMesh } from './windowFactory';
import { TALL_Z_OFFSET_TO_FRONT } from './windowFactory';

export type SideWindowSpec = {
  id: string;
  kind: 'small' | 'tall';
  type?: 'small' | 'tall';
  zCenter: number;
  width: number;
  groundY0: number;
  groundY1: number;
  firstY0: number;
  firstY1: number;
};

export type SideWindowBuildConfig = {
  profile: readonly FacadeSegment[];
  outwardX: 1 | -1;
  zTransform?: (z:number)=>number;
  alignToFacadePanels?: boolean; // NEW
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

export function buildSideWindows(specs: readonly SideWindowSpec[], cfg: SideWindowBuildConfig): THREE.Object3D[] {
  const outward = cfg.outwardX;
  const interiorDir = -outward;

  return specs.flatMap((spec) => {
    let zCenter = cfg.zTransform ? cfg.zTransform(spec.zCenter) : spec.zCenter;

    const isTall = spec.kind === 'tall' || spec.type === 'tall';
    if (isTall) {
      zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
    }
    const xFace = xFaceForProfileAtZ(cfg.profile, zCenter);

    // If your holes are in facade panels, the "opening plane" is NOT xFace,
    // it's the facade panel plane used by wallsGround/wallsFirst:
    const xOuterReveal = cfg.alignToFacadePanels
      ? (xFace - FACADE_PANEL_PLANE_OFFSET)
      : xFace;
    const xInnerReveal = xOuterReveal + interiorDir * (wallThickness.exterior ?? 0.3);
    const xOuterPlane = xOuterReveal + outward * EPS;

    const frameX = xOuterPlane - outward * (FRAME_DEPTH / 2);
    const glassX = frameX + interiorDir * GLASS_INSET;

    const commonProps = {
      frameX,
      glassX,
      xFace: xOuterPlane,
      zCenter,
      side: outward === 1 ? 'left' : 'right',
    } as const;

    const out: WindowFactoryMesh[] = [];

    if (spec.groundY1 > spec.groundY0) {
      const s = levelBandSpec(spec, spec.groundY0, spec.groundY1);
      out.push(...(spec.kind === 'small'
        ? makeSimpleWindow({ ...commonProps, spec: s })
        : makeSplitTallWindow({ ...commonProps, spec: s, levelHeights })));
      out.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterReveal, xInner: xInnerReveal }));
    }

    if (spec.firstY1 > spec.firstY0) {
      const s = levelBandSpec(spec, spec.firstY0, spec.firstY1);
      out.push(...(spec.kind === 'small'
        ? makeSimpleWindow({ ...commonProps, spec: s })
        : makeSplitTallWindow({ ...commonProps, spec: s, levelHeights })));
      out.push(...createRevealMeshes({ spec: s, zCenter, xOuter: xOuterReveal, xInner: xInnerReveal }));
    }

    return out.map(asMesh);
  });
}
