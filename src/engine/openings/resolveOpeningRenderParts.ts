import type { OpeningStyleSpec } from '../architecturalTypes';
import { DEFAULT_FRAME_EDGES, DEFAULT_OPENING_STYLE } from './openingDefaults';
import {
  SILL_DEPTH as DEFAULT_SILL_DEPTH,
  SILL_HEIGHT as DEFAULT_SILL_HEIGHT,
  SILL_OVERHANG as DEFAULT_SILL_PROJECTION,
  SILL_WIDTH_OVERHANG as DEFAULT_SILL_WIDTH_OVERHANG,
} from '../../model/constants/windowConstants';

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
  originOffsetZ?: number;
  parts: OpeningRenderPart[];
};

type ResolveOpeningRenderOptions = {
  kind?: 'window' | 'door';
  sillHeight?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const FRONT_PORTAL_STONE_PROJECTION = 0.04;
const THRESHOLD_LIFT = 0.003;

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
  frameDepth: number
): OpeningRenderPart[] {
  const jambWidth = Math.min(Math.max(openingWidth * 0.19, 0.16), openingWidth * 0.24);
  const surroundDepth = Math.min(Math.max(frameDepth * 1.8, 0.2), 0.28);
  const capHeight = Math.min(Math.max(openingHeight * 0.09, 0.16), 0.24);
  const plinthHeight = 0.08;
  const surroundOverlap = Math.min(frameThickness * 0.4, jambWidth * 0.3);
  const clearOpeningWidth = Math.max(0.18, openingWidth - frameThickness * 0.9);
  const transomHeight = Math.min(Math.max(openingHeight * 0.2, 0.34), 0.46);
  const leafHeight = Math.max(0.35, openingHeight - transomHeight - frameThickness * 1.35);
  const leafWidth = Math.max(0.18, clearOpeningWidth - frameThickness * 0.45);
  const woodDepth = Math.max(frameDepth * 0.42, 0.05);
  const transomGlassDepth = Math.max(woodDepth * 0.45, 0.015);
  const transomY = openingHeight / 2 - transomHeight / 2;
  const leafY = -openingHeight / 2 + leafHeight / 2 + frameThickness * 0.75;
  const capY = openingHeight / 2 + capHeight / 2 - frameThickness * 0.15;
  const surroundOuterWidth = openingWidth + jambWidth * 2 - surroundOverlap * 2;
  const pedimentHeight = 0.06;
  const pedimentWidth = surroundOuterWidth + jambWidth * 0.5;
  const diagonalLength = Math.hypot(clearOpeningWidth, transomHeight);
  const diagonalThickness = Math.max(frameThickness * 0.24, 0.018);
  const diagonalDepth = Math.max(transomGlassDepth, woodDepth * 0.5);

  return [
    {
      key: 'stone-jamb-left',
      material: 'stone',
      debugType: 'opening',
      size: [jambWidth, openingHeight + plinthHeight, surroundDepth],
      position: [-openingWidth / 2 - jambWidth / 2 + surroundOverlap, -plinthHeight / 2, 0],
    },
    {
      key: 'stone-jamb-right',
      material: 'stone',
      debugType: 'opening',
      size: [jambWidth, openingHeight + plinthHeight, surroundDepth],
      position: [openingWidth / 2 + jambWidth / 2 - surroundOverlap, -plinthHeight / 2, 0],
    },
    {
      key: 'stone-cap',
      material: 'stone',
      debugType: 'opening',
      size: [surroundOuterWidth, capHeight, surroundDepth],
      position: [0, capY, 0],
    },
    {
      key: 'stone-threshold',
      material: 'stone',
      debugIgnore: true,
      size: [surroundOuterWidth + surroundOverlap * 0.5, plinthHeight, surroundDepth * 0.9],
      position: [0, -openingHeight / 2 - plinthHeight / 2 + THRESHOLD_LIFT, surroundDepth * 0.05],
    },
    {
      key: 'wood-leaf',
      material: 'wood',
      debugType: 'opening',
      size: [leafWidth, leafHeight, woodDepth],
      position: [0, leafY, -frameThickness * 0.12],
    },
    {
      key: 'wood-panel-upper',
      material: 'wood',
      debugIgnore: true,
      size: [leafWidth * 0.78, leafHeight * 0.35, woodDepth * 0.3],
      position: [0, leafY + leafHeight * 0.2, woodDepth / 2 + 0.003],
    },
    {
      key: 'wood-panel-lower',
      material: 'wood',
      debugIgnore: true,
      size: [leafWidth * 0.78, leafHeight * 0.31, woodDepth * 0.3],
      position: [0, leafY - leafHeight * 0.24, woodDepth / 2 + 0.003],
    },
    {
      key: 'transom-glass',
      material: 'glass',
      debugType: 'opening',
      size: [clearOpeningWidth, transomHeight, transomGlassDepth],
      position: [0, transomY, -frameThickness * 0.06],
    },
    {
      key: 'transom-frame-top',
      material: 'frame',
      debugIgnore: true,
      size: [clearOpeningWidth + frameThickness * 0.2, frameThickness, woodDepth],
      position: [0, transomY + transomHeight / 2 - frameThickness / 2, 0],
    },
    {
      key: 'transom-frame-bottom',
      material: 'frame',
      debugIgnore: true,
      size: [clearOpeningWidth + frameThickness * 0.2, frameThickness, woodDepth],
      position: [0, transomY - transomHeight / 2 + frameThickness / 2, 0],
    },
    {
      key: 'transom-frame-left',
      material: 'frame',
      debugIgnore: true,
      size: [frameThickness, transomHeight, woodDepth],
      position: [-clearOpeningWidth / 2 + frameThickness / 2, transomY, 0],
    },
    {
      key: 'transom-frame-right',
      material: 'frame',
      debugIgnore: true,
      size: [frameThickness, transomHeight, woodDepth],
      position: [clearOpeningWidth / 2 - frameThickness / 2, transomY, 0],
    },
    {
      key: 'transom-cross-left',
      material: 'frame',
      debugIgnore: true,
      size: [diagonalLength, diagonalThickness, diagonalDepth],
      position: [0, transomY, woodDepth / 2 + 0.004],
      rotation: [0, 0, Math.atan2(transomHeight, clearOpeningWidth)],
    },
    {
      key: 'transom-cross-right',
      material: 'frame',
      debugIgnore: true,
      size: [diagonalLength, diagonalThickness, diagonalDepth],
      position: [0, transomY, woodDepth / 2 + 0.004],
      rotation: [0, 0, -Math.atan2(transomHeight, clearOpeningWidth)],
    },
  ];
}

export function resolveOpeningRenderParts(
  openingWidth: number,
  openingHeight: number,
  style: OpeningStyleSpec | undefined,
  wallThickness: number,
  options: ResolveOpeningRenderOptions = {}
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

  const sillThickness = Math.max(style?.sillThickness ?? DEFAULT_SILL_HEIGHT, 0.01);
  const sillDepth = Math.max(style?.sillDepth ?? DEFAULT_SILL_DEPTH, 0.01);
  const sillOverhang = Math.max(frameThickness * 0.5, DEFAULT_SILL_WIDTH_OVERHANG / 2);
  const sillProjection = Math.max(DEFAULT_SILL_PROJECTION, 0);
  const renderSill =
    style?.hasSill === true || (options.kind === 'window' && (options.sillHeight ?? 1) <= 0.001);
  const lintelThickness = Math.max(frameThickness * 1.15, 0.02);
  const lintelDepth = frameDepth;
  const lintelOverhang = Math.max(frameThickness * 0.35, 0.02);

  if (style?.variant === 'frontPortalDoor') {
    return {
      frameThickness,
      frameDepth,
      glassInset,
      glassThickness,
      originOffsetZ: FRONT_PORTAL_STONE_PROJECTION,
      parts: createFrontPortalDoorParts(openingWidth, openingHeight, frameThickness, frameDepth),
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

  if (renderSill) {
    parts.push({
      key: 'sill',
      material: 'stone',
      debugIgnore: true,
      size: [openingWidth + sillOverhang * 2, sillThickness, sillDepth],
      position: [
        0,
        -openingHeight / 2 - sillThickness / 2 + THRESHOLD_LIFT,
        frameDepth / 2 + sillDepth / 2 + sillProjection,
      ],
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
