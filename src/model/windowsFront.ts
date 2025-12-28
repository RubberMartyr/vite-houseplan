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

type FrontOpeningSpec =
  | {
      id: string;
      kind: 'window';
      width: number;
      height: number;
      xCenter: number;
      yBottom: number;
      grid?: { cols: number; rows: number };
    }
  | {
      id: string;
      kind: 'door';
      width: number;
      height: number;
      xCenter: number;
      yBottom: number;
    };

// --- shared constants (mirrors windowsRear.ts conventions) ---
const EPS = 0.01;
const FRAME_DEPTH = 0.08;
// Front facade frame thickness set to ≈5.5 cm to match elevation
const FRAME_BORDER = 0.055;
const GLASS_INSET = 0.015;
const MUNTIN_WIDTH = 0.03; // thinner than frame border

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
  color: 0x2a2f33,
  roughness: 0.85,
  metalness: 0.05,
});

const anthraciteStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f1f1f,
  roughness: 0.82,
  metalness: 0.05,
});

const oakMaterial = new THREE.MeshStandardMaterial({
  color: 0xd7b58a,
  roughness: 0.75,
  metalness: 0.0,
});

const doorGlassMaterial = new THREE.MeshStandardMaterial({
  color: 0x99aabb,
  transparent: true,
  opacity: 0.35,
  roughness: 0.2,
  metalness: 0.0,
});

const anthraciteBandMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.7,
  metalness: 0.1,
});

// Architectural eaves reference for aligning upper openings
const EAVES_BAND_TOP_Y = 5.70;
// Dormer glass top aligned to visible eaves band edge (calibrated)
const DORMER_GLASS_TOP_Y = 5.15; // lowered further to match elevation

// Apply this only to front facade windows and the front door; do not change rear or side windows.
// Front facade: plan distances are measured from the LEFT edge,
// but in the scene the front facade is mirrored in X.
const FRONT_WIDTH_M = 9.6; // 960 cm
const RIGHT_EDGE_X = FRONT_WIDTH_M / 2;

export function frontXCenter(xFromLeft: number, openingWidth: number): number {
  return RIGHT_EDGE_X - (xFromLeft + openingWidth / 2);
}

// Front facade utility: builds a framed window with optional muntin grid (vertical + horizontal)
function makeWindowMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  grid?: { cols: number; rows: number };
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
    grid,
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

  // Grid-style muntins for front facade elevation (keeps mesh approach used elsewhere)
  if (grid && grid.cols >= 1 && grid.rows >= 1) {
    const columnSpacing = innerWidth / grid.cols;
    const rowSpacing = innerHeight / grid.rows;

    // vertical muntins (between columns)
    for (let col = 1; col < grid.cols; col += 1) {
      const xOffset = -innerWidth / 2 + columnSpacing * col;
      meshes.push({
        id: `${idBase}_MULLION_V${col}`,
        geometry: new THREE.BoxGeometry(MUNTIN_WIDTH, innerHeight, FRAME_DEPTH),
        position: [xCenter + xOffset, yCenter, frameZ],
        rotation: [0, 0, 0],
        material: frameMaterial,
      });
    }

    // horizontal muntins (between rows)
    for (let row = 1; row < grid.rows; row += 1) {
      const yOffset = -innerHeight / 2 + rowSpacing * row;
      meshes.push({
        id: `${idBase}_MULLION_H${row}`,
        geometry: new THREE.BoxGeometry(innerWidth, MUNTIN_WIDTH, FRAME_DEPTH),
        position: [xCenter, yCenter + yOffset, frameZ],
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

function makeWindowBandMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  margin?: number;
  thickness?: number;
  depth?: number;
}): WindowMesh[] {
  const { idBase, width, height, xCenter, yBottom, zFace, margin = 0.08, thickness = 0.04, depth = 0.03 } = params;

  const outerWidth = width + 2 * margin;
  const outerHeight = height + 2 * margin;
  const bandZ = zFace - EPS - depth / 2;

  const leftX = xCenter - (width / 2 + margin - thickness / 2);
  const rightX = xCenter + (width / 2 + margin - thickness / 2);
  const centerY = yBottom + height / 2;
  const topY = yBottom + height + margin - thickness / 2;
  const bottomY = yBottom - margin + thickness / 2;

  return [
    {
      id: `${idBase}_BAND_TOP`,
      geometry: new THREE.BoxGeometry(outerWidth, thickness, depth),
      position: [xCenter, topY, bandZ],
      rotation: [0, 0, 0],
      material: anthraciteBandMaterial,
    },
    {
      id: `${idBase}_BAND_BOTTOM`,
      geometry: new THREE.BoxGeometry(outerWidth, thickness, depth),
      position: [xCenter, bottomY, bandZ],
      rotation: [0, 0, 0],
      material: anthraciteBandMaterial,
    },
    {
      id: `${idBase}_BAND_LEFT`,
      geometry: new THREE.BoxGeometry(thickness, outerHeight, depth),
      position: [leftX, centerY, bandZ],
      rotation: [0, 0, 0],
      material: anthraciteBandMaterial,
    },
    {
      id: `${idBase}_BAND_RIGHT`,
      geometry: new THREE.BoxGeometry(thickness, outerHeight, depth),
      position: [rightX, centerY, bandZ],
      rotation: [0, 0, 0],
      material: anthraciteBandMaterial,
    },
  ];
}

function makeAnthraciteSurroundRing(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  bandMargin?: number;
  holeClearance?: number;
  depth?: number;
}): WindowMesh {
  const { idBase, width, height, xCenter, yBottom, zFace, bandMargin = 0.1, depth = 0.04 } = params;

  const outerWidth = width + 2 * bandMargin;
  const outerHeight = height + 2 * bandMargin;
  const holeClearance = -0.006; // 6mm overlap so no brick seam is visible
  const holeWidth = width + 2 * holeClearance;
  const holeHeight = height + 2 * holeClearance;

  const shape = new THREE.Shape();
  shape.moveTo(-outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, -outerHeight / 2);
  shape.lineTo(outerWidth / 2, outerHeight / 2);
  shape.lineTo(-outerWidth / 2, outerHeight / 2);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-holeWidth / 2, -holeHeight / 2);
  hole.lineTo(holeWidth / 2, -holeHeight / 2);
  hole.lineTo(holeWidth / 2, holeHeight / 2);
  hole.lineTo(-holeWidth / 2, holeHeight / 2);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);

  const yCenter = yBottom + height / 2;
  const z = zFace - EPS - depth / 2 - 0.002;

  const anthracite = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.7,
    metalness: 0.1,
  });

  return {
    id: `${idBase}_BAND_RING`,
    geometry,
    position: [xCenter, yCenter, z],
    rotation: [0, 0, 0],
    material: anthracite,
  };
}

// Matches elevation: 2 big panes on bottom + dense transom grid above with a separating bar
function makeGroundClassicTransomWindowMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  transomHeight?: number;
  topGrid?: { cols: number; rows: number };
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
    transomHeight = 0.35,
    topGrid = { cols: 6, rows: 2 },
    hasSill = true,
    hasLintel = true,
  } = params;

  // Base frame + glass (+ sill/lintel) with no full-height grid
  const meshes = makeWindowMeshes({
    idBase,
    width,
    height,
    xCenter,
    yBottom,
    zFace,
    hasSill,
    hasLintel,
  });

  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const clampedTransomHeight = Math.min(transomHeight, innerHeight * 0.45);
  const innerBottomY = yBottom + FRAME_BORDER;
  const innerTopY = yBottom + height - FRAME_BORDER;
  const transomBottomY = innerTopY - clampedTransomHeight;
  const bottomHeight = transomBottomY - innerBottomY;

  const frameZ = zFace - EPS + FRAME_DEPTH / 2;
  const muntinThickness = Math.max(FRAME_BORDER * 0.45, 0.012);

  // Bottom mullion (two large panes)
  meshes.push({
    id: `${idBase}_MULLION_BOTTOM_V`,
    geometry: new THREE.BoxGeometry(muntinThickness, bottomHeight, FRAME_DEPTH),
    position: [xCenter, innerBottomY + bottomHeight / 2, frameZ],
    rotation: [0, 0, 0],
    material: frameMaterial,
  });

  // Transom separator bar
  meshes.push({
    id: `${idBase}_TRANSOM_BAR`,
    geometry: new THREE.BoxGeometry(innerWidth, muntinThickness, FRAME_DEPTH),
    position: [xCenter, transomBottomY, frameZ],
    rotation: [0, 0, 0],
    material: frameMaterial,
  });

  const transomCenterY = transomBottomY + clampedTransomHeight / 2;
  const { cols, rows } = topGrid;

  // Transom vertical grid
  if (cols && cols > 1) {
    const colSpacing = innerWidth / cols;
    for (let col = 1; col < cols; col += 1) {
      const xOffset = -innerWidth / 2 + colSpacing * col;
      meshes.push({
        id: `${idBase}_TRANSOM_V${col}`,
        geometry: new THREE.BoxGeometry(muntinThickness, clampedTransomHeight, FRAME_DEPTH),
        position: [xCenter + xOffset, transomCenterY, frameZ],
        rotation: [0, 0, 0],
        material: frameMaterial,
      });
    }
  }

  // Transom horizontal grid
  if (rows && rows > 1) {
    const rowSpacing = clampedTransomHeight / rows;
    for (let row = 1; row < rows; row += 1) {
      const yOffset = -clampedTransomHeight / 2 + rowSpacing * row;
      meshes.push({
        id: `${idBase}_TRANSOM_H${row}`,
        geometry: new THREE.BoxGeometry(innerWidth, muntinThickness, FRAME_DEPTH),
        position: [xCenter, transomCenterY + yOffset, frameZ],
        rotation: [0, 0, 0],
        material: frameMaterial,
      });
    }
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

function makeFrontDoorDetailedMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
}): WindowMesh[] {
  const { idBase, width, height, xCenter, yBottom, zFace } = params;
  const yCenter = yBottom + height / 2;

  // 1) Anthracite surround ring
  const surroundDepth = 0.06;
  const surroundMargin = 0.1;
  const outerWidth = width + 2 * surroundMargin;
  const outerHeight = height + 2 * surroundMargin;
  const surroundShape = new THREE.Shape();
  surroundShape.moveTo(-outerWidth / 2, -outerHeight / 2);
  surroundShape.lineTo(outerWidth / 2, -outerHeight / 2);
  surroundShape.lineTo(outerWidth / 2, outerHeight / 2);
  surroundShape.lineTo(-outerWidth / 2, outerHeight / 2);
  surroundShape.closePath();

  const surroundHole = new THREE.Path();
  surroundHole.moveTo(-width / 2, -height / 2);
  surroundHole.lineTo(width / 2, -height / 2);
  surroundHole.lineTo(width / 2, height / 2);
  surroundHole.lineTo(-width / 2, height / 2);
  surroundHole.closePath();
  surroundShape.holes.push(surroundHole);

  const surroundGeometry = new THREE.ExtrudeGeometry(surroundShape, {
    depth: surroundDepth,
    bevelEnabled: false,
  });
  surroundGeometry.translate(0, 0, -surroundDepth / 2);

  const surroundZ = zFace - EPS - surroundDepth / 2 - 0.002;

  // 2) Inner door frame
  const doorFrameBorder = 0.05;
  const doorFrameDepth = 0.07;
  const frameOuterWidth = width;
  const frameOuterHeight = height;
  const frameInnerWidth = frameOuterWidth - 2 * doorFrameBorder;
  const frameInnerHeight = frameOuterHeight - 2 * doorFrameBorder;
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-frameOuterWidth / 2, -frameOuterHeight / 2);
  frameShape.lineTo(frameOuterWidth / 2, -frameOuterHeight / 2);
  frameShape.lineTo(frameOuterWidth / 2, frameOuterHeight / 2);
  frameShape.lineTo(-frameOuterWidth / 2, frameOuterHeight / 2);
  frameShape.closePath();

  const frameHole = new THREE.Path();
  frameHole.moveTo(-frameInnerWidth / 2, -frameInnerHeight / 2);
  frameHole.lineTo(frameInnerWidth / 2, -frameInnerHeight / 2);
  frameHole.lineTo(frameInnerWidth / 2, frameInnerHeight / 2);
  frameHole.lineTo(-frameInnerWidth / 2, frameInnerHeight / 2);
  frameHole.closePath();
  frameShape.holes.push(frameHole);

  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: doorFrameDepth,
    bevelEnabled: false,
  });
  frameGeometry.translate(0, 0, -doorFrameDepth / 2);

  const frameZ = zFace - EPS + doorFrameDepth / 2;

  // 3) Door leaf (light oak)
  const transomHeight = 0.35;
  const leafHeight = height - transomHeight;
  const leafWidth = width - 2 * doorFrameBorder;
  const leafThickness = 0.045;
  const leafGeometry = new THREE.BoxGeometry(leafWidth, leafHeight, leafThickness);
  const leafZ = surroundZ + surroundDepth / 2 + 0.03 + leafThickness / 2;
  const leafYCenter = yBottom + leafHeight / 2;

  // 4) Door panels
  const panelInset = 0.012;
  const panelBorder = 0.08;
  const panelThickness = 0.015;
  const panelZoneHeight = leafHeight * 0.45;
  const panelWidth = leafWidth - 2 * panelBorder;
  const panelHeight = panelZoneHeight - 2 * panelBorder;
  const panelZ = leafZ - leafThickness / 2 + panelThickness / 2 + panelInset;
  const panelGap = leafHeight * 0.1;
  const bottomPanelCenterY = yBottom + panelZoneHeight / 2;
  const topPanelCenterY = yBottom + panelZoneHeight + panelGap + panelZoneHeight / 2;

  // 5) Transom glazing
  const transomWidth = leafWidth;
  const glassThickness = 0.01;
  const transomCenterY = yBottom + leafHeight + transomHeight / 2;
  const transomGlassZ = zFace - EPS + FRAME_DEPTH / 2 + GLASS_INSET;

  // 6) Transom diagonal muntins
  const transomAngle = Math.atan2(transomHeight, transomWidth);
  const muntinBarThickness = 0.018;
  const muntinBarDepth = FRAME_DEPTH;
  const muntinLength = Math.sqrt(transomWidth * transomWidth + transomHeight * transomHeight);

  // 7) Anthracite threshold
  const thresholdHeight = 0.06;
  const thresholdDepth = 0.2;
  const thresholdWidth = outerWidth;
  const thresholdZ = zFace - EPS - thresholdDepth / 2;

  // 8) Anthracite head cap
  const capHeight = 0.08;
  const capDepth = 0.06;
  const capOverhang = 0.05;
  const capWidth = outerWidth + 2 * capOverhang;
  const capY = yBottom + height + surroundMargin - capHeight / 2;
  const capZ = zFace - EPS - capDepth / 2 - 0.002;

  const meshes: WindowMesh[] = [
    {
      id: `${idBase}_SURROUND_RING`,
      geometry: surroundGeometry,
      position: [xCenter, yCenter, surroundZ],
      rotation: [0, 0, 0],
      material: anthraciteStoneMaterial,
    },
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: [xCenter, yCenter, frameZ],
      rotation: [0, 0, 0],
      material: frameMaterial,
    },
    {
      id: `${idBase}_LEAF`,
      geometry: leafGeometry,
      position: [xCenter, leafYCenter, leafZ],
      rotation: [0, 0, 0],
      material: oakMaterial,
    },
    {
      id: `${idBase}_PANEL_BOTTOM`,
      geometry: new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
      position: [xCenter, bottomPanelCenterY, panelZ],
      rotation: [0, 0, 0],
      material: oakMaterial,
    },
    {
      id: `${idBase}_PANEL_TOP`,
      geometry: new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
      position: [xCenter, topPanelCenterY, panelZ],
      rotation: [0, 0, 0],
      material: oakMaterial,
    },
    {
      id: `${idBase}_TRANSOM_GLASS`,
      geometry: new THREE.BoxGeometry(transomWidth, transomHeight, glassThickness),
      position: [xCenter, transomCenterY, transomGlassZ],
      rotation: [0, 0, 0],
      material: doorGlassMaterial,
    },
    {
      id: `${idBase}_TRANSOM_X1`,
      geometry: new THREE.BoxGeometry(muntinLength, muntinBarThickness, muntinBarDepth),
      position: [xCenter, transomCenterY, frameZ],
      rotation: [0, 0, transomAngle],
      material: frameMaterial,
    },
    {
      id: `${idBase}_TRANSOM_X2`,
      geometry: new THREE.BoxGeometry(muntinLength, muntinBarThickness, muntinBarDepth),
      position: [xCenter, transomCenterY, frameZ],
      rotation: [0, 0, -transomAngle],
      material: frameMaterial,
    },
    {
      id: `${idBase}_THRESHOLD`,
      geometry: new THREE.BoxGeometry(thresholdWidth, thresholdHeight, thresholdDepth),
      position: [xCenter, yBottom + thresholdHeight / 2, thresholdZ],
      rotation: [0, 0, 0],
      material: anthraciteStoneMaterial,
    },
    {
      id: `${idBase}_LINTEL`,
      geometry: new THREE.BoxGeometry(width + 0.12, LINTEL_HEIGHT, LINTEL_DEPTH),
      position: [xCenter, yBottom + height + LINTEL_HEIGHT / 2, zFace - EPS - LINTEL_DEPTH / 2],
      rotation: [0, 0, 0],
      material: anthraciteStoneMaterial,
    },
    {
      id: `${idBase}_SURROUND_CAP`,
      geometry: new THREE.BoxGeometry(capWidth, capHeight, capDepth),
      position: [xCenter, capY, capZ],
      rotation: [0, 0, 0],
      material: anthraciteStoneMaterial,
    },
  ];

  return meshes;
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

const xFrontDoorCenter = xG_DOOR;

const groundOpenings: FrontOpeningSpec[] = [
  {
    id: 'FRONT_G_W1',
    kind: 'window',
    width: 1.10,
    height: 1.60,
    xCenter: xG_W1,
    yBottom: 0.70,
    grid: { cols: 2, rows: 3 }, // big window: 2 columns x 3 rows
  },
  {
    id: 'FRONT_G_W2',
    kind: 'window',
    width: 1.10,
    height: 1.60,
    xCenter: xG_W2,
    yBottom: 0.70,
    grid: { cols: 2, rows: 3 }, // big window: 2 columns x 3 rows
  },
  { id: 'FRONT_G_DOOR', kind: 'door', width: 1.00, height: 2.50, xCenter: xG_DOOR, yBottom: 0.00 },
  // small WC window: 165..215 => yBottom=1.65 height=0.50
  {
    id: 'FRONT_G_W3',
    kind: 'window',
    width: 0.70,
    height: 0.50,
    xCenter: xG_W3,
    yBottom: 1.65,
    grid: { cols: 3, rows: 3 }, // small window: 3 columns x 3 rows
  },
] as const;

// From chain: 125 | 90(win) | 90 | 90(win) | 110 | 90(win) | 120 | 70(win) | 175
// First floor
const F_W1 = 1.25;
const F_W2 = 1.25 + 0.90 + 0.90;
const F_W4 = 1.25 + 0.90 + 0.90 + 0.90 + 1.10 + 0.90 + 1.20;

const xF_W1 = frontXCenter(F_W1, 0.90);
const xF_W2 = frontXCenter(F_W2, 0.90);
const xF_W4 = frontXCenter(F_W4, 0.70);

const dormerWidth = 0.9;
const dormerHeight = 1.0;
// Anchor the dormer vertically from the glass top so adjusting DORMER_GLASS_TOP_Y alone shifts it.
const dormerGlassTopY = DORMER_GLASS_TOP_Y;
const dormerYBottom = dormerGlassTopY - dormerHeight;

const firstOpenings: FrontOpeningSpec[] = [
  // big windows: sill=3.40, top=5.00 => 1.60
  { id: 'FRONT_F_W1', width: 0.90, height: 1.60, xCenter: xF_W1, yBottom: 3.40, grid: { cols: 2, rows: 3 } },
  { id: 'FRONT_F_W2', width: 0.90, height: 1.60, xCenter: xF_W2, yBottom: 3.40, grid: { cols: 2, rows: 3 } },
  {
    id: 'FRONT_F_W3',
    width: dormerWidth,
    height: dormerHeight,
    xCenter: xFrontDoorCenter,
    yBottom: dormerYBottom,
    grid: { cols: 3, rows: 3 },
  },
  // small window: sill=4.10, top=5.00 => 0.90
  { id: 'FRONT_F_W4', width: 0.70, height: 0.90, xCenter: xF_W4, yBottom: 4.10, grid: { cols: 2, rows: 2 } },
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
    if (o.id === 'FRONT_G_DOOR') {
      return makeFrontDoorDetailedMeshes({
        idBase: o.id,
        width: o.width,
        height: o.height,
        xCenter: o.xCenter,
        yBottom: o.yBottom,
        zFace: frontZ,
      });
    }
    return [];
  }
  if (o.kind === 'window' && (o.id === 'FRONT_G_W1' || o.id === 'FRONT_G_W2')) {
    return makeGroundClassicTransomWindowMeshes({
      idBase: o.id,
      width: o.width,
      height: o.height,
      xCenter: o.xCenter,
      yBottom: o.yBottom,
      zFace: frontZ,
      transomHeight: 0.35,
      topGrid: { cols: 6, rows: 2 },
    });
  }
  return makeWindowMeshes({
    idBase: o.id,
    width: o.width,
    height: o.height,
    xCenter: o.xCenter,
    yBottom: o.yBottom,
    zFace: frontZ,
    grid: o.grid,
  });
});

const firstMeshes: WindowMesh[] = firstOpenings.flatMap((o) => {
  const windowMeshes = makeWindowMeshes({
    idBase: o.id,
    width: o.width,
    height: o.height,
    xCenter: o.xCenter,
    yBottom: o.yBottom,
    zFace: frontZ,
    grid: o.grid,
    ...(o.id === 'FRONT_F_W3' ? { hasSill: false, hasLintel: false } : {}),
  });

  if (o.id === 'FRONT_F_W3') {
    return windowMeshes.concat(
      makeAnthraciteSurroundRing({
        idBase: o.id,
        width: o.width,
        height: o.height,
        xCenter: o.xCenter,
        yBottom: o.yBottom,
        zFace: frontZ,
      })
    );
  }

  return windowMeshes;
});

export const windowsFront: { meshes: WindowMesh[] } = {
  meshes: [...groundMeshes, ...firstMeshes],
};
