import type { OpeningStyleSpec } from '../architecturalTypes';
import { DEFAULT_FRAME_EDGES, DEFAULT_OPENING_STYLE } from './openingDefaults';

export type OpeningRenderPart = {
  key: string;
  size: [number, number, number];
  position: [number, number, number];
  material: 'frame' | 'glass' | 'wood' | 'stone';
  rotation?: [number, number, number];
  debugType?: 'opening';
  debugIgnore?: boolean;
};

export type OpeningRenderConfig = {
  frameThickness: number;
  frameDepth: number;
  glassInset: number;
  glassThickness: number;
  parts: OpeningRenderPart[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeFractions(fractions: number[] | undefined, fallbackCount: number): number[] {
  const cleaned = (fractions ?? []).filter((value) => Number.isFinite(value) && value > 0);

  if (cleaned.length >= 2) {
    const total = cleaned.reduce((sum, value) => sum + value, 0);
    return cleaned.map((value) => value / total);
  }

  return Array.from({ length: Math.max(fallbackCount, 1) }, () => 1 / Math.max(fallbackCount, 1));
}

function resolveRowFractions(style: OpeningStyleSpec | undefined, rows: number): number[] {
  if (style?.variant === 'verticalTransom') {
    if (style.rowFractions && style.rowFractions.length >= 2) {
      return normalizeFractions(style.rowFractions, style.rowFractions.length);
    }

    const transomRatio = style.transomRatio ?? 0.62;
    const clampedRatio = clamp(transomRatio, 0.1, 0.9);
    return [clampedRatio, 1 - clampedRatio];
  }

  return normalizeFractions(style?.rowFractions, rows);
}

function createFrontPortalDoorParts(
  openingWidth: number,
  openingHeight: number,
  frameThickness: number,
  frameDepth: number,
  wallThickness: number
): OpeningRenderPart[] {
  const surroundBand = Math.min(Math.max(openingWidth * 0.11, 0.09), 0.12);
  const stoneDepth = Math.max(wallThickness + 0.08, 0.38);
  const stoneProjection = 0.05;
  const stoneCenterZ = wallThickness / 2 + stoneProjection - stoneDepth / 2;
  const capHeight = Math.min(Math.max(openingHeight * 0.08, 0.13), 0.18);
  const sillHeight = 0.035;
  const clearWidth = Math.max(0.22, openingWidth);
  const transomHeight = Math.min(Math.max(openingHeight * 0.2, 0.34), 0.42);
  const transomBandHeight = Math.max(frameThickness * 0.65, 0.03);
  const woodGap = 0.012;
  const woodWidth = Math.max(0.2, clearWidth - woodGap * 2);
  const leafHeight = Math.max(0.45, openingHeight - transomHeight - transomBandHeight);
  const leafWidth = woodWidth;
  const woodDepth = Math.max(frameDepth * 0.6, 0.07);
  const woodCenterZ = wallThickness / 2 - woodDepth / 2 - 0.01;
  const transomGlassDepth = Math.max(woodDepth * 0.28, 0.018);
  const transomY = openingHeight / 2 - transomHeight / 2;
  const leafY = -openingHeight / 2 + leafHeight / 2;
  const diagonalLength = Math.hypot(woodWidth, transomHeight);
  const diagonalThickness = Math.max(frameThickness * 0.18, 0.014);
  const panelDepth = Math.max(woodDepth * 0.18, 0.012);
  const panelInset = Math.max(frameThickness * 0.28, 0.02);
  const transomCrossZ = woodCenterZ + woodDepth / 2 + 0.002;
  const panelZ = woodCenterZ + woodDepth / 2 + panelDepth / 2;

  return [
    {
      key: 'stone-jamb-left',
      material: 'stone',
      debugType: 'opening',
      size: [surroundBand, openingHeight + capHeight, stoneDepth],
      position: [-openingWidth / 2 - surroundBand / 2, capHeight / 2, stoneCenterZ],
    },
    {
      key: 'stone-jamb-right',
      material: 'stone',
      debugType: 'opening',
      size: [surroundBand, openingHeight + capHeight, stoneDepth],
      position: [openingWidth / 2 + surroundBand / 2, capHeight / 2, stoneCenterZ],
    },
    {
      key: 'stone-cap',
      material: 'stone',
      debugType: 'opening',
      size: [openingWidth + surroundBand * 2, capHeight, stoneDepth],
      position: [0, openingHeight / 2 + capHeight / 2, stoneCenterZ],
    },
    {
      key: 'stone-sill',
      material: 'stone',
      debugIgnore: true,
      size: [openingWidth + surroundBand * 2, sillHeight, stoneDepth],
      position: [0, -openingHeight / 2 - sillHeight / 2, stoneCenterZ],
    },
    {
      key: 'wood-leaf',
      material: 'wood',
      debugType: 'opening',
      size: [leafWidth, leafHeight, woodDepth],
      position: [0, leafY, woodCenterZ],
    },
    {
      key: 'wood-panel-upper',
      material: 'wood',
      debugIgnore: true,
      size: [leafWidth - panelInset * 2, leafHeight * 0.34, panelDepth],
      position: [0, leafY + leafHeight * 0.2, panelZ],
    },
    {
      key: 'wood-panel-lower',
      material: 'wood',
      debugIgnore: true,
      size: [leafWidth - panelInset * 2, leafHeight * 0.3, panelDepth],
      position: [0, leafY - leafHeight * 0.24, panelZ],
    },
    {
      key: 'transom-glass',
      material: 'glass',
      debugType: 'opening',
      size: [woodWidth, transomHeight, transomGlassDepth],
      position: [0, transomY, woodCenterZ + woodDepth / 2 - transomGlassDepth / 2],
    },
    {
      key: 'transom-frame-top',
      material: 'wood',
      debugIgnore: true,
      size: [woodWidth, transomBandHeight, woodDepth],
      position: [0, transomY + transomHeight / 2 - transomBandHeight / 2, woodCenterZ],
    },
    {
      key: 'transom-frame-bottom',
      material: 'wood',
      debugIgnore: true,
      size: [woodWidth, transomBandHeight, woodDepth],
      position: [0, transomY - transomHeight / 2 + transomBandHeight / 2, woodCenterZ],
    },
    {
      key: 'transom-frame-left',
      material: 'wood',
      debugIgnore: true,
      size: [transomBandHeight, transomHeight, woodDepth],
      position: [-woodWidth / 2 + transomBandHeight / 2, transomY, woodCenterZ],
    },
    {
      key: 'transom-frame-right',
      material: 'wood',
      debugIgnore: true,
      size: [transomBandHeight, transomHeight, woodDepth],
      position: [woodWidth / 2 - transomBandHeight / 2, transomY, woodCenterZ],
    },
    {
      key: 'transom-cross-left',
      material: 'wood',
      debugIgnore: true,
      size: [diagonalLength, diagonalThickness, diagonalThickness],
      position: [0, transomY, transomCrossZ],
      rotation: [0, 0, Math.atan2(transomHeight, woodWidth)],
    },
    {
      key: 'transom-cross-right',
      material: 'wood',
      debugIgnore: true,
      size: [diagonalLength, diagonalThickness, diagonalThickness],
      position: [0, transomY, transomCrossZ],
      rotation: [0, 0, -Math.atan2(transomHeight, woodWidth)],
    },
  ];
}

export function resolveOpeningRenderParts(
  openingWidth: number,
  openingHeight: number,
  style: OpeningStyleSpec | undefined,
  wallThickness: number
): OpeningRenderConfig {
  const frameThickness = Math.max(style?.frameThickness ?? DEFAULT_OPENING_STYLE.frameThickness, 0.01);
  const frameDepth = Math.max(
    Math.min(style?.frameDepth ?? wallThickness, wallThickness),
    0.01
  );
  const glassThickness = clamp(
    style?.glassThickness ?? DEFAULT_OPENING_STYLE.glassThickness,
    0.005,
    frameDepth
  );
  const maxInset = Math.max((frameDepth - glassThickness) / 2, 0);
  const glassInset = clamp(style?.glassInset ?? DEFAULT_OPENING_STYLE.glassInset, -maxInset, maxInset);

  const frameEdges = {
    ...DEFAULT_FRAME_EDGES,
    ...(style?.frameEdges ?? {}),
  };
  const leftFrameThickness = frameEdges.left ? frameThickness : 0;
  const rightFrameThickness = frameEdges.right ? frameThickness : 0;
  const topFrameThickness = frameEdges.top ? frameThickness : 0;
  const bottomFrameThickness = frameEdges.bottom ? frameThickness : 0;

  const glassWidth = Math.max(0.01, openingWidth - leftFrameThickness - rightFrameThickness);
  const glassHeight = Math.max(0.01, openingHeight - topFrameThickness - bottomFrameThickness);
  const glassCenterX = (leftFrameThickness - rightFrameThickness) / 2;
  const glassCenterY = (bottomFrameThickness - topFrameThickness) / 2;
  const mullionThickness = clamp(
    style?.mullionWidth ?? frameThickness * 0.9,
    0.01,
    Math.min(glassWidth, glassHeight)
  );
  const mullionDepth = clamp(frameDepth * 0.65, glassThickness, frameDepth);
  const mullionOffset = glassInset + glassThickness / 2 + 0.002;

  const cols = Math.max(style?.grid?.cols ?? 1, 1);
  const rows = Math.max(style?.grid?.rows ?? 1, 1);
  const columnFractions = normalizeFractions(undefined, cols);
  const rowFractions = resolveRowFractions(style, rows);

  const sillThickness = Math.max(style?.sillThickness ?? 0.04, 0.01);
  const sillDepth = Math.max(style?.sillDepth ?? 0.06, 0.01);
  const sillOverhang = Math.max(frameThickness * 0.5, 0.02);
  const lintelThickness = Math.max(frameThickness * 1.15, 0.02);
  const lintelDepth = frameDepth;
  const lintelOverhang = Math.max(frameThickness * 0.35, 0.02);

  if (style?.variant === 'frontPortalDoor') {
    return {
      frameThickness,
      frameDepth,
      glassInset,
      glassThickness,
      parts: createFrontPortalDoorParts(
        openingWidth,
        openingHeight,
        frameThickness,
        frameDepth,
        wallThickness
      ),
    };
  }

  const parts: OpeningRenderPart[] = [
    {
      key: 'glass',
      material: 'glass',
      debugType: 'opening',
      size: [glassWidth, glassHeight, glassThickness],
      position: [glassCenterX, glassCenterY, glassInset],
    },
  ];

  if (frameEdges.left) {
    parts.push({
      key: 'frame-left',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [-openingWidth / 2 + frameThickness / 2, 0, 0],
    });
  }

  if (frameEdges.right) {
    parts.push({
      key: 'frame-right',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [openingWidth / 2 - frameThickness / 2, 0, 0],
    });
  }

  if (frameEdges.top) {
    parts.push({
      key: 'frame-top',
      material: 'frame',
      debugType: 'opening',
      size: [glassWidth, frameThickness, frameDepth],
      position: [glassCenterX, openingHeight / 2 - frameThickness / 2, 0],
    });
  }

  if (frameEdges.bottom) {
    parts.push({
      key: 'frame-bottom',
      material: 'frame',
      debugType: 'opening',
      size: [glassWidth, frameThickness, frameDepth],
      position: [glassCenterX, -openingHeight / 2 + frameThickness / 2, 0],
    });
  }

  let cumulativeWidth = -glassWidth / 2;
  for (let index = 0; index < columnFractions.length - 1; index += 1) {
    cumulativeWidth += glassWidth * columnFractions[index];
    parts.push({
      key: `mullion-v-${index}`,
      material: 'frame',
      debugIgnore: true,
      size: [mullionThickness, glassHeight, mullionDepth],
      position: [glassCenterX + cumulativeWidth, glassCenterY, mullionOffset],
    });
  }

  let cumulativeHeight = -glassHeight / 2;
  for (let index = 0; index < rowFractions.length - 1; index += 1) {
    cumulativeHeight += glassHeight * rowFractions[index];
    parts.push({
      key: `mullion-h-${index}`,
      material: 'frame',
      debugIgnore: true,
      size: [glassWidth, mullionThickness, mullionDepth],
      position: [glassCenterX, glassCenterY + cumulativeHeight, mullionOffset],
    });
  }

  if (style?.hasSill) {
    parts.push({
      key: 'sill',
      material: 'frame',
      debugIgnore: true,
      size: [openingWidth + sillOverhang * 2, sillThickness, sillDepth],
      position: [0, -openingHeight / 2 - sillThickness / 2, frameDepth / 2 + sillDepth / 2],
    });
  }

  if (style?.hasLintel) {
    parts.push({
      key: 'lintel',
      material: 'frame',
      debugIgnore: true,
      size: [openingWidth + lintelOverhang * 2, lintelThickness, lintelDepth],
      position: [0, openingHeight / 2 + lintelThickness / 2, 0],
    });
  }

  return {
    frameThickness,
    frameDepth,
    glassInset,
    glassThickness,
    parts,
  };
}
