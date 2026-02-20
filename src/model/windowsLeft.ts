import * as THREE from 'three';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import { getEnvelopeOuterPolygon } from './envelope';
import { EPS, FRAME_DEPTH, GLASS_INSET } from './constants/windowConstants';
import { createRevealMeshes, makeSimpleWindow, makeSplitTallWindow, type WindowFactoryMesh, type WindowFactorySpec } from './builders/windowFactory';

export type SideWindowMesh = {
  id: string;
  meshes: THREE.Object3D[];
};

type SideWindowSpec = WindowFactorySpec & {
  zCenter: number;
};

const TALL_Z_OFFSET_TO_FRONT = 0.70;

export const ARCH_LEFT_FACADE_SEGMENTS = [
  { id:'L_A', z0:0.0, z1:4.0,  x:4.8 },
  { id:'L_B', z0:4.0, z1:8.45, x:4.1 },
  { id:'L_C', z0:8.45,z1:12.0, x:3.5 },
] as const;

function xFaceAtZ(z: number) {
  const segment = ARCH_LEFT_FACADE_SEGMENTS.find((candidate) => z >= candidate.z0 && z <= candidate.z1)
    ?? ARCH_LEFT_FACADE_SEGMENTS[ARCH_LEFT_FACADE_SEGMENTS.length - 1];
  return segment.x;
}

const sideWindowSpecs: SideWindowSpec[] = [
  {
    id: 'SIDE_L_EXT',
    kind: 'small',
    zCenter: 1.2,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0.0,
    firstY1: 0.0,
  },
  {
    id: 'SIDE_L_TALL_1',
    kind: 'tall',
    zCenter: 4.6,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_2',
    kind: 'tall',
    zCenter: 6.8,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_3',
    kind: 'tall',
    zCenter: 9.35,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
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

const pts = getEnvelopeOuterPolygon();
const sideZMin = Math.min(...pts.map((p) => p.z));
const sideZMax = Math.max(...pts.map((p) => p.z));
const mirrorZ = (z: number) => sideZMin + sideZMax - z;

function getSideWindowZCenter(spec: SideWindowSpec) {
  let zCenter = mirrorZ(spec.zCenter);
  if (spec.kind === 'tall') {
    zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
  }
  return zCenter;
}

const meshes: SideWindowMesh[] = sideWindowSpecs.map((spec) => {
  const zCenter = getSideWindowZCenter(spec);

  const xFaceForWindow = xFaceAtZ(zCenter);
  const outwardNormal = new THREE.Vector3(1, 0, 0);
  const interiorDir = -outwardNormal.x;
  const wallDepth = wallThickness.exterior ?? 0.3;

  const xOuterReveal = xFaceForWindow;
  const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
  const xOuterPlane = xOuterReveal + outwardNormal.x * EPS;

  const frameXForWindow = xOuterPlane - outwardNormal.x * (FRAME_DEPTH / 2);
  const glassXForWindow = frameXForWindow + interiorDir * GLASS_INSET;

  const commonProps = { spec, frameX: frameXForWindow, glassX: glassXForWindow, xFace: xOuterPlane, zCenter, side: 'right' as const };
  const windowSpecs = spec.kind === 'small'
    ? makeSimpleWindow(commonProps)
    : makeSplitTallWindow({ ...commonProps, levelHeights });

  const revealSpecs = createRevealMeshes({
    spec,
    zCenter,
    xOuter: xOuterReveal,
    xInner: xInnerReveal,
  });

  return { id: spec.id, meshes: [...windowSpecs, ...revealSpecs].map(asMesh) };
});

export const windowsLeft = {
  meshes,
  profile: ARCH_LEFT_FACADE_SEGMENTS,
};
