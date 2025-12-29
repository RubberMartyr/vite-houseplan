import * as THREE from 'three';
import {
  EnvelopePoint,
  ceilingHeights,
  leftFacadeProfile,
  levelHeights,
  rightFacadeProfile,
  wallThickness,
} from './houseSpec';
import { getEnvelopeOuterPolygon } from './envelope';

type SideWindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

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

const EPS = 0.01;
const FRAME_DEPTH = 0.08;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;
const GLASS_THICKNESS = 0.01;
const METAL_BAND_DEPTH = 0.02;
const METAL_BAND_HEIGHT = 0.12;
const METAL_BAND_OUTSET = 0.015;
const SILL_DEPTH = 0.18;
const SILL_HEIGHT = 0.05;
const SILL_OVERHANG = 0.02;
const REVEAL_FACE = 0.05;
export const TALL_Z_OFFSET_TO_FRONT = 0.70; // meters

function windowVerticalExtents(spec: SideWindowSpec) {
  const yBottom = spec.groundY0;
  const yTop = spec.kind === 'tall' ? Math.max(spec.groundY1, spec.firstY1) : spec.groundY1;

  return {
    yBottom,
    height: yTop - yBottom,
  };
}

export const MIRROR_Z = true;

export const sideWindowSpecs: SideWindowSpec[] = [
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

function profileXAtZ(profile: EnvelopePoint[], z: number): number {
  if (!profile.length) return 0;

  const minZ = Math.min(...profile.map((point) => point.z));
  const maxZ = Math.max(...profile.map((point) => point.z));
  const clampedZ = Math.min(Math.max(z, minZ), maxZ);

  for (let i = 0; i < profile.length - 1; i += 1) {
    const a = profile[i];
    const b = profile[i + 1];
    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (clampedZ < zMin - EPS || clampedZ > zMax + EPS) continue;

    if (Math.abs(a.x - b.x) < EPS || Math.abs(zMax - zMin) < EPS) {
      return a.x;
    }

    const t = (clampedZ - a.z) / (b.z - a.z || 1);
    return a.x + t * (b.x - a.x);
  }

  return profile[profile.length - 1].x;
}

export function xAtZ(facade: 'left' | 'right', z: number): number {
  const profile = facade === 'left' ? leftFacadeProfile : rightFacadeProfile;
  return profileXAtZ(profile, z);
}

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#e6e8ea',
  transmission: 0.85,
  roughness: 0.05,
  ior: 1.5,
  metalness: 0,
  clearcoat: 0,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

const metalSlateMaterial = new THREE.MeshStandardMaterial({
  color: '#6b6f73',
  roughness: 0.4,
  metalness: 0.6,
});

const metalBandMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f3237,
  roughness: 0.6,
  metalness: 0.2,
});

const revealMaterial = new THREE.MeshStandardMaterial({
  color: '#e8e5df',
  roughness: 0.85,
  metalness: 0.05,
});

function createFrameGeometry(width: number, height: number): THREE.ExtrudeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, -halfHeight);

  const innerPath = new THREE.Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const geometry = new THREE.ExtrudeGeometry(outerShape, { depth: FRAME_DEPTH, bevelEnabled: false });
  geometry.translate(0, 0, -FRAME_DEPTH / 2);
  geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createGlassGeometry(width: number, height: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(GLASS_THICKNESS, height, width);
}

function createSill({
  id,
  width,
  zCenter,
  yBottom,
  side,
  xFace,
}: {
  id: string;
  width: number;
  zCenter: number;
  yBottom: number;
  side: 'left' | 'right';
  xFace: number;
}): SideWindowMesh {
  const sillX = side === 'left' ? xFace - SILL_DEPTH / 2 - SILL_OVERHANG : xFace + SILL_DEPTH / 2 + SILL_OVERHANG;

  const geometry = new THREE.BoxGeometry(SILL_DEPTH, SILL_HEIGHT, width + 0.04);
  const position: [number, number, number] = [sillX, yBottom - SILL_HEIGHT / 2, zCenter];

  return {
    id,
    geometry,
    position,
    rotation: [0, 0, 0],
    material: blueStoneMaterial,
  };
}

function createRevealMeshes({
  spec,
  zCenter,
  xOuter,
  xInner,
}: {
  spec: SideWindowSpec;
  zCenter: number;
  xOuter: number;
  xInner: number;
}): SideWindowMesh[] {
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const revealDepth = Math.abs(xOuter - xInner);
  const xMid = (xOuter + xInner) / 2;
  const halfWidth = spec.width / 2;
  const jambThickness = Math.min(REVEAL_FACE, spec.width / 2);
  const headThickness = Math.min(REVEAL_FACE, height / 2);
  const clearWidth = Math.max(0.01, spec.width - 2 * jambThickness);

  console.log('✅ REVEAL per window', spec.id, { zCenter, xOuter, xInner, revealDepth });

  return [
    {
      id: `${spec.id}_REVEAL_LEFT`,
      geometry: new THREE.BoxGeometry(revealDepth, height, jambThickness),
      position: [xMid, yCenter, zCenter - halfWidth + jambThickness / 2],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_RIGHT`,
      geometry: new THREE.BoxGeometry(revealDepth, height, jambThickness),
      position: [xMid, yCenter, zCenter + halfWidth - jambThickness / 2],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_HEAD`,
      geometry: new THREE.BoxGeometry(revealDepth, headThickness, clearWidth),
      position: [xMid, yBottom + height - headThickness / 2, zCenter],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
    {
      id: `${spec.id}_REVEAL_SILL`,
      geometry: new THREE.BoxGeometry(revealDepth, headThickness, clearWidth),
      position: [xMid, yBottom + headThickness / 2, zCenter],
      rotation: [0, 0, 0],
      material: revealMaterial,
    },
  ];
}

function makeSimpleWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const yCenter = yBottom + height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = createFrameGeometry(width, height);
  const glassGeometry = createGlassGeometry(innerWidth, innerHeight);

  return [
    {
      id: `${id}_FRAME`,
      geometry: frameGeometry,
      position: [frameX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${id}_GLASS`,
      geometry: glassGeometry,
      position: [glassX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
    createSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }),
  ];
}

function makeSplitTallWindow({
  spec,
  frameX,
  glassX,
  xFace,
  zCenter,
  side,
}: {
  spec: SideWindowSpec;
  frameX: number;
  glassX: number;
  xFace: number;
  zCenter: number;
  side: 'left' | 'right';
}): SideWindowMesh[] {
  const { id, width } = spec;
  const { height, yBottom } = windowVerticalExtents(spec);
  const frameGeometry = createFrameGeometry(width, height);
  const yCenter = yBottom + height / 2;
  const windowBottomLocal = -height / 2;

  const lowerGlassHeight = 2.45;
  const bandHeight = 0.45;
  const upperGlassHeight = 2.1;
  const innerWidth = width - 2 * FRAME_BORDER;

  const lowerGlassCenterLocalY = windowBottomLocal + lowerGlassHeight / 2;
  const metalBandCenterLocalY = windowBottomLocal + 2.45 + bandHeight / 2;
  const upperGlassCenterLocalY = windowBottomLocal + 2.9 + upperGlassHeight / 2;

  const meshes: SideWindowMesh[] = [
    {
      id: `${id}_FRAME`,
      geometry: frameGeometry,
      position: [frameX, yCenter, zCenter],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${id}_GLASS_LOWER`,
      geometry: createGlassGeometry(innerWidth, lowerGlassHeight),
      position: [glassX, yCenter + lowerGlassCenterLocalY, zCenter],
      rotation: [0, 0, 0],
      material: glassMaterial,
    },
  ];

  meshes.push({
    id: `${id}_GLASS_UPPER`,
    geometry: createGlassGeometry(innerWidth, upperGlassHeight),
    position: [glassX, yCenter + upperGlassCenterLocalY, zCenter],
    rotation: [0, 0, 0],
    material: glassMaterial,
  });

  meshes.push({
    id: `${id}_METAL_BAND`,
    geometry: new THREE.BoxGeometry(METAL_BAND_DEPTH, bandHeight, innerWidth),
    position: [glassX, yCenter + metalBandCenterLocalY, zCenter],
    rotation: [0, 0, 0],
    material: metalSlateMaterial,
  });

  meshes.push(createSill({ id: `${id}_SILL`, width, zCenter, yBottom, side, xFace }));

  const slateBandWidth = spec.width + 0.06;
  const slateBandHeight = 0.08;
  const slateBandDepth = 0.02;
  const slateBandY = levelHeights.firstFloor;
  const slateOutward = side === 'left' ? -1 : 1;
  const slateBandX = xFace + slateOutward * (FRAME_DEPTH / 2 + 0.02);
  meshes.push({
    id: `${id}_SLATE_BAND`,
    geometry: new THREE.BoxGeometry(slateBandDepth, slateBandHeight, slateBandWidth),
    position: [slateBandX, slateBandY, zCenter],
    rotation: [0, 0, 0],
    material: metalBandMaterial,
  });

  const bandY = levelHeights.firstFloor;
  const outward = side === 'left' ? -1 : 1;
  const bandX = frameX + outward * (FRAME_DEPTH / 2 - METAL_BAND_DEPTH / 2 + METAL_BAND_OUTSET);
  meshes.push({
    id: `${id}_FLOOR_BAND`,
    geometry: new THREE.BoxGeometry(METAL_BAND_DEPTH, METAL_BAND_HEIGHT, width),
    position: [bandX, bandY, zCenter],
    rotation: [0, 0, 0],
    material: metalBandMaterial,
  });

  return meshes;
}

const pts = getEnvelopeOuterPolygon();
export const sideZMin = Math.min(...pts.map((p) => p.z));
export const sideZMax = Math.max(...pts.map((p) => p.z));
export function sideMirrorZ(z: number, zMin: number, zMax: number, mirror: boolean) {
  return mirror ? zMin + zMax - z : z;
}

export function makeMirrorZ(zMin: number, zMax: number) {
  return (z: number) => sideMirrorZ(z, zMin, zMax, MIRROR_Z);
}

export function getSideWindowZCenter(spec: SideWindowSpec, mirrorZ: (z: number) => number) {
  let zCenter = mirrorZ(spec.zCenter);

  const isTall = spec.kind === 'tall' || spec.type === 'tall';
  if (isTall) {
    zCenter = zCenter - TALL_Z_OFFSET_TO_FRONT;
  }
  return zCenter;
}

export function sideWindowZ(spec: SideWindowSpec, mirrorZ: (z: number) => number) {
  return getSideWindowZCenter(spec, mirrorZ);
}

function buildSideWindowMeshes(specs: SideWindowSpec[], facade: 'left' | 'right', mirrorZ: (z: number) => number) {
  const outward = facade === 'right' ? 1 : -1;
  const interiorDir = -outward;
  const wallDepth = wallThickness.exterior ?? 0.3;

  return specs.flatMap((spec) => {
    const zCenter = getSideWindowZCenter(spec, mirrorZ);
    const xFaceForWindow = xAtZ(facade, zCenter);

    const xOuterReveal = xFaceForWindow;
    const xInnerReveal = xOuterReveal + interiorDir * wallDepth;
    const xOuterPlane = xOuterReveal + outward * EPS;

    const frameXForWindow = xOuterPlane - outward * (FRAME_DEPTH / 2);
    const glassXForWindow = frameXForWindow + interiorDir * GLASS_INSET;

    console.log('SIDE WINDOW POS', {
      id: spec.id,
      zCenter,
      xFaceForWindow,
      xOuterPlane,
      xInnerPlane: xInnerReveal,
      frameXForWindow,
      glassXForWindow,
    });

    const commonProps = {
      spec,
      frameX: frameXForWindow,
      glassX: glassXForWindow,
      xFace: xOuterPlane,
      zCenter,
      side: facade,
    };

    const revealMeshes = createRevealMeshes({
      spec,
      zCenter,
      xOuter: xOuterReveal,
      xInner: xInnerReveal,
    });

    const windowMeshes = spec.kind === 'small' ? makeSimpleWindow(commonProps) : makeSplitTallWindow(commonProps);
    return [...windowMeshes, ...revealMeshes];
  });
}

export function buildSideWindows(specs: SideWindowSpec[], facade: 'left' | 'right') {
  const mirrorZ = makeMirrorZ(sideZMin, sideZMax);
  console.log('✅ SIDE WINDOWS MODEL COORDS', { side: facade, zMin: sideZMin, zMax: sideZMax, mirrorZ: MIRROR_Z });

  const meshes = buildSideWindowMeshes(specs, facade, mirrorZ);

  return {
    meshes,
    side: facade,
    zMin: sideZMin,
    zMax: sideZMax,
    mirrorZ: MIRROR_Z,
  };
}

export const windowsSide = buildSideWindows(sideWindowSpecs, 'left');
