import * as THREE from 'three';
import { frontZ, levelHeights } from './houseSpec';

type WindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

export type FrontOpeningRect = {
  id: string;
  level: 'ground' | 'first';
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

// --- shared constants (mirrors windowsRear.ts conventions) ---
const EPS = 0.01;
const FRAME_DEPTH = 0.08;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;

const SILL_DEPTH = 0.10;
const SILL_HEIGHT = 0.05;

const LINTEL_DEPTH = 0.05;
const LINTEL_HEIGHT = 0.08;

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

// Apply this only to front facade windows and the front door; do not change rear or side windows.
// Front facade: plan distances are measured from the LEFT edge,
// but in the scene the front facade is mirrored in X.
const FRONT_WIDTH_M = 9.6; // 960 cm
const RIGHT_EDGE_X = FRONT_WIDTH_M / 2;

export function frontXCenter(xFromLeft: number, openingWidth: number): number {
  return RIGHT_EDGE_X - (xFromLeft + openingWidth / 2);
}

function makeWindowMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  mullions?: number;
  hasSill?: boolean;
  hasLintel?: boolean;
}): WindowMesh[] {
  const {
    idBase,
    width,
    height,
    xCenter,
    yBottom,
    zFace,
    mullions = 0,
    hasSill = true,
    hasLintel = true,
  } = params;

  const yCenter = yBottom + height / 2;

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  // Frame shape (extruded ring)
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, halfHeight);
  outerShape.closePath();

  const innerHole = new THREE.Path();
  innerHole.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerHole.lineTo(innerWidth / 2, -innerHeight / 2);
  innerHole.lineTo(innerWidth / 2, innerHeight / 2);
  innerHole.lineTo(-innerWidth / 2, innerHeight / 2);
  innerHole.closePath();
  outerShape.holes.push(innerHole);

  const frameGeometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: false,
  });
  frameGeometry.translate(0, 0, -FRAME_DEPTH / 2);

  const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.01);

  /**
   * FRONT FACADE:
   * - Outside of house points toward -Z
   * - The facade plane is at zFace (frontZ)
   * - Put the OUTER face slightly “out” of the facade plane to avoid z-fighting
   */
  const frameZ = zFace - EPS + FRAME_DEPTH / 2;
  const glassZ = frameZ + GLASS_INSET;

  const meshes: WindowMesh[] = [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: [xCenter, yCenter, frameZ],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${idBase}_GLASS`,
      geometry: glassGeometry,
      position: [xCenter, yCenter, glassZ],
      rotation: [0, 0, 0],
      // no material => HouseViewer fallback assigns glass
    },
  ];

  if (mullions > 0) {
    const mullionWidth = FRAME_BORDER / 2;
    const spacing = innerWidth / (mullions + 1);
    for (let i = 1; i <= mullions; i += 1) {
      const xOffset = -innerWidth / 2 + spacing * i;
      meshes.push({
        id: `${idBase}_MULLION_${i}`,
        geometry: new THREE.BoxGeometry(mullionWidth, innerHeight, FRAME_DEPTH),
        position: [xCenter + xOffset, yCenter, frameZ],
        rotation: [0, 0, 0],
        material: frameMaterial,
      });
    }
  }

  if (hasSill) {
    meshes.push(
      makeSill({
        id: `${idBase}_SILL`,
        width,
        xCenter,
        yCenter: yBottom + SILL_HEIGHT / 2,
        zFace,
      })
    );
  }

  if (hasLintel) {
    meshes.push(
      makeLintel({
        id: `${idBase}_LINTEL`,
        width,
        xCenter,
        yCenter: yBottom + height + LINTEL_HEIGHT / 2,
        zFace,
      })
    );
  }

  return meshes;
}

function makeSill({
  id,
  width,
  xCenter,
  yCenter,
  zFace,
}: {
  id: string;
  width: number;
  xCenter: number;
  yCenter: number;
  zFace: number;
}): WindowMesh {
  const geom = new THREE.BoxGeometry(width + 0.10, SILL_HEIGHT, SILL_DEPTH);
  const z = zFace - EPS - SILL_DEPTH / 2; // outwards (-Z)
  return { id, geometry: geom, position: [xCenter, yCenter, z], rotation: [0, 0, 0], material: blueStoneMaterial };
}

function makeLintel({
  id,
  width,
  xCenter,
  yCenter,
  zFace,
}: {
  id: string;
  width: number;
  xCenter: number;
  yCenter: number;
  zFace: number;
}): WindowMesh {
  const geom = new THREE.BoxGeometry(width + 0.12, LINTEL_HEIGHT, LINTEL_DEPTH);
  const z = zFace - EPS - LINTEL_DEPTH / 2; // outwards (-Z)
  return { id, geometry: geom, position: [xCenter, yCenter, z], rotation: [0, 0, 0], material: blueStoneMaterial };
}

function makeDoorMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
}): WindowMesh[] {
  const { idBase, width, height, xCenter, yBottom, zFace } = params;
  const yCenter = yBottom + height / 2;

  const border = FRAME_BORDER;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-width / 2, -height / 2);
  outerShape.lineTo(width / 2, -height / 2);
  outerShape.lineTo(width / 2, height / 2);
  outerShape.lineTo(-width / 2, height / 2);
  outerShape.closePath();

  const innerHole = new THREE.Path();
  innerHole.moveTo(-width / 2 + border, -height / 2 + border);
  innerHole.lineTo(width / 2 - border, -height / 2 + border);
  innerHole.lineTo(width / 2 - border, height / 2 - border);
  innerHole.lineTo(-width / 2 + border, height / 2 - border);
  innerHole.closePath();
  outerShape.holes.push(innerHole);

  const frameGeometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: false,
  });
  frameGeometry.translate(0, 0, -FRAME_DEPTH / 2);

  const frameZ = zFace - EPS + FRAME_DEPTH / 2;

  // Door leaf/panel slightly behind the frame (toward inside = +Z)
  const panelWidth = width - 2 * border;
  const panelHeight = height - 2 * border;
  const panelThickness = 0.04;
  const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness);
  const panelZ = frameZ + 0.015 + panelThickness / 2;

  return [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: [xCenter, yCenter, frameZ],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${idBase}_PANEL`,
      geometry: panelGeometry,
      position: [xCenter, yCenter, panelZ],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    makeLintel({
      id: `${idBase}_LINTEL`,
      width,
      xCenter,
      yCenter: yBottom + height + LINTEL_HEIGHT / 2,
      zFace,
    }),
  ];
}

// --- FRONT FACADE SPEC (derived from your 960cm chain dimensions) ---
// Coordinate convention: x = left→right across facade, z = depth, y = height.
// left edge ≈ -4.8m, right edge ≈ +4.8m.

// From chain: 115 | 110(win) | 70 | 110(win) | 95 | 100(door) | 115 | 70(win) | 175
// Ground floor (from plan chains)
const G_W1 = 1.15;
const G_W2 = 1.15 + 1.10 + 0.70;
const G_DOOR = 1.15 + 1.10 + 0.70 + 1.10 + 0.95;
const G_W3 = 1.15 + 1.10 + 0.70 + 1.10 + 0.95 + 1.00 + 1.15;

const xG_W1 = frontXCenter(G_W1, 1.10);
const xG_W2 = frontXCenter(G_W2, 1.10);
const xG_DOOR = frontXCenter(G_DOOR, 1.00);
const xG_W3 = frontXCenter(G_W3, 0.70);

const groundOpenings = [
  { id: 'FRONT_G_W1', kind: 'window', width: 1.10, height: 1.60, xCenter: xG_W1, yBottom: 0.70, mullions: 1 },
  { id: 'FRONT_G_W2', kind: 'window', width: 1.10, height: 1.60, xCenter: xG_W2, yBottom: 0.70, mullions: 1 },
  { id: 'FRONT_G_DOOR', kind: 'door',   width: 1.00, height: 2.50, xCenter: xG_DOOR, yBottom: 0.00 },
  // small WC window: 165..215 => yBottom=1.65 height=0.50
  { id: 'FRONT_G_W3', kind: 'window', width: 0.70, height: 0.50, xCenter: xG_W3, yBottom: 1.65, mullions: 0 },
] as const;

// From chain: 125 | 90(win) | 90 | 90(win) | 110 | 90(win) | 120 | 70(win) | 175
// First floor
const F_W1 = 1.25;
const F_W2 = 1.25 + 0.90 + 0.90;
const F_W3 = 1.25 + 0.90 + 0.90 + 0.90 + 1.10;
const F_W4 = 1.25 + 0.90 + 0.90 + 0.90 + 1.10 + 0.90 + 1.20;

const xF_W1 = frontXCenter(F_W1, 0.90);
const xF_W2 = frontXCenter(F_W2, 0.90);
const xF_W3 = frontXCenter(F_W3, 0.90);
const xF_W4 = frontXCenter(F_W4, 0.70);

const firstOpenings = [
  // big windows: sill=3.40, top=5.00 => 1.60
  { id: 'FRONT_F_W1', width: 0.90, height: 1.60, xCenter: xF_W1, yBottom: 3.40, mullions: 1 },
  { id: 'FRONT_F_W2', width: 0.90, height: 1.60, xCenter: xF_W2, yBottom: 3.40, mullions: 1 },
  { id: 'FRONT_F_W3', width: 0.90, height: 1.60, xCenter: xF_W3, yBottom: 3.40, mullions: 1 },
  // small window: sill=4.10, top=5.00 => 0.90
  { id: 'FRONT_F_W4', width: 0.70, height: 0.90, xCenter: xF_W4, yBottom: 4.10, mullions: 0 },
] as const;

// --- opening rects for facade holes (used by wallsGround/wallsFirst) ---
export const frontOpeningRectsGround: FrontOpeningRect[] = groundOpenings.map((o) => ({
  id: o.id,
  level: 'ground',
  xMin: o.xCenter - o.width / 2,
  xMax: o.xCenter + o.width / 2,
  yMin: o.yBottom,
  yMax: o.yBottom + o.height,
}));

export const frontOpeningRectsFirst: FrontOpeningRect[] = firstOpenings.map((o) => ({
  id: o.id,
  level: 'first',
  xMin: o.xCenter - o.width / 2,
  xMax: o.xCenter + o.width / 2,
  yMin: o.yBottom - levelHeights.firstFloor,       // local to first-floor wall base
  yMax: (o.yBottom - levelHeights.firstFloor) + o.height,
}));

// --- meshes ---
const groundMeshes: WindowMesh[] = groundOpenings.flatMap((o) => {
  if (o.kind === 'door') {
    return makeDoorMeshes({ idBase: o.id, width: o.width, height: o.height, xCenter: o.xCenter, yBottom: o.yBottom, zFace: frontZ });
  }
  return makeWindowMeshes({
    idBase: o.id,
    width: o.width,
    height: o.height,
    xCenter: o.xCenter,
    yBottom: o.yBottom,
    zFace: frontZ,
    mullions: (o as any).mullions ?? 0,
  });
});

const firstMeshes: WindowMesh[] = firstOpenings.flatMap((o) =>
  makeWindowMeshes({
    idBase: o.id,
    width: o.width,
    height: o.height,
    xCenter: o.xCenter,
    yBottom: o.yBottom,
    zFace: frontZ,
    mullions: o.mullions,
  })
);

export const windowsFront: { meshes: WindowMesh[] } = {
  meshes: [...groundMeshes, ...firstMeshes],
};
