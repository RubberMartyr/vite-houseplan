import type { OpeningStyleSpec } from '../architecturalTypes';
import { debugFlags } from '../debug/debugFlags';
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
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const FRONT_PORTAL_STONE_PROJECTION = 0.04;
const THRESHOLD_LIFT = 0.003;
const SILL_FRAME_CONTACT_DEPTH = 0.002;
const SEPARATOR_PANEL_FRONT_INSET = 0.002;

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
  style: OpeningStyleSpec | undefined
): OpeningRenderPart[] {
  const jambWidth = Math.min(Math.max(openingWidth * 0.19, 0.16), openingWidth * 0.24);
  const surroundDepth = Math.min(Math.max(frameDepth * 1.8, 0.2), 0.28);
  const capHeight = Math.min(Math.max(openingHeight * 0.09, 0.16), 0.24);
  const plinthHeight = 0.08;
  const surroundOverlap = Math.min(frameThickness * 0.4, jambWidth * 0.3);
  const portalFrameThickness = clamp(frameThickness * 1.55, 0.075, 0.14);
  const clearOpeningWidth = Math.max(0.18, openingWidth - portalFrameThickness * 1.1);
  const transomSectionHeight = clamp(
    openingHeight * (style?.transomRatio ?? 0.24),
    0.46,
    0.62
  );
  const transomHeight = Math.max(0.16, transomSectionHeight - portalFrameThickness * 2);
  const leafHeight = Math.max(0.35, openingHeight - transomSectionHeight - frameThickness * 1.05);
  const leafWidth = Math.max(0.18, clearOpeningWidth - frameThickness * 0.45);
  const woodDepth = Math.max(frameDepth * 0.42, 0.05);
  const transomGlassDepth = Math.max(woodDepth * 0.45, 0.015);
  const transomY = openingHeight / 2 - transomSectionHeight / 2 - frameThickness * 0.1;
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
      position: [0, transomY, -portalFrameThickness * 0.05],
    },
    {
      key: 'transom-frame-top',
      material: 'frame',
      debugIgnore: true,
      size: [clearOpeningWidth + portalFrameThickness * 2, portalFrameThickness, woodDepth],
      position: [0, transomY + transomHeight / 2 + portalFrameThickness / 2, 0],
    },
    {
      key: 'transom-frame-bottom',
      material: 'frame',
      debugIgnore: true,
      size: [clearOpeningWidth + portalFrameThickness * 2, portalFrameThickness, woodDepth],
      position: [0, transomY - transomHeight / 2 - portalFrameThickness / 2, 0],
    },
    {
      key: 'transom-frame-left',
      material: 'frame',
      debugIgnore: true,
      size: [portalFrameThickness, transomSectionHeight, woodDepth],
      position: [-clearOpeningWidth / 2 - portalFrameThickness / 2, transomY, 0],
    },
    {
      key: 'transom-frame-right',
      material: 'frame',
      debugIgnore: true,
      size: [portalFrameThickness, transomSectionHeight, woodDepth],
      position: [clearOpeningWidth / 2 + portalFrameThickness / 2, transomY, 0],
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

function createDetailedDoorParts(
  openingWidth: number,
  openingHeight: number,
  frameThickness: number,
  frameDepth: number,
  glassInset: number,
  glassThickness: number
): OpeningRenderPart[] {
  const thresholdThickness = Math.max(frameThickness * 0.7, 0.025);
  const thresholdDepth = Math.min(Math.max(frameDepth * 1.1, 0.08), frameDepth + 0.04);
  const thresholdWidth = openingWidth + frameThickness * 0.6;
  const panelGap = Math.max(frameThickness * 0.18, 0.012);
  const topSectionHeight = Math.max(
    0.01,
    openingHeight * 0.5 - frameThickness - panelGap / 2
  );
  const bottomSectionHeight = Math.max(
    0.01,
    openingHeight * 0.5 - frameThickness - panelGap / 2
  );
  const sectionWidth = Math.max(0.01, openingWidth - frameThickness * 2);
  const topSectionCenterY = openingHeight / 4 + panelGap / 2;
  const bottomSectionCenterY = -openingHeight / 4 - panelGap / 2;
  const midRailDepth = frameDepth;
  const midRailWidth = sectionWidth;
  const panelDepth = Math.max(frameDepth * 0.72, glassThickness * 2);
  const panelZ = 0;
  const glazingFrameDepth = Math.max(frameDepth * 0.82, glassThickness);
  const innerTopFrameThickness = clamp(frameThickness * 0.72, 0.018, topSectionHeight / 3);
  const topGlassWidth = Math.max(0.01, sectionWidth - innerTopFrameThickness * 2);
  const topGlassHeight = Math.max(0.01, topSectionHeight - innerTopFrameThickness * 2);
  const topGlassZ = clamp(
    glassInset,
    -(glazingFrameDepth - glassThickness) / 2,
    (glazingFrameDepth - glassThickness) / 2
  );

  return [
    {
      key: 'glass',
      material: 'glass',
      debugType: 'opening',
      size: [topGlassWidth, topGlassHeight, glassThickness],
      position: [0, topSectionCenterY, topGlassZ],
    },
    {
      key: 'frame-left',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [-openingWidth / 2 + frameThickness / 2, 0, 0],
    },
    {
      key: 'frame-right',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [openingWidth / 2 - frameThickness / 2, 0, 0],
    },
    {
      key: 'frame-top',
      material: 'frame',
      debugType: 'opening',
      size: [sectionWidth, frameThickness, frameDepth],
      position: [0, openingHeight / 2 - frameThickness / 2, 0],
    },
    {
      key: 'frame-bottom',
      material: 'frame',
      debugType: 'opening',
      size: [sectionWidth, frameThickness, frameDepth],
      position: [0, -openingHeight / 2 + frameThickness / 2, 0],
    },
    {
      key: 'mid-rail',
      material: 'frame',
      debugIgnore: true,
      size: [midRailWidth, frameThickness, midRailDepth],
      position: [0, 0, 0],
    },
    {
      key: 'top-frame-left',
      material: 'frame',
      debugIgnore: true,
      size: [innerTopFrameThickness, topSectionHeight, glazingFrameDepth],
      position: [-sectionWidth / 2 + innerTopFrameThickness / 2, topSectionCenterY, 0],
    },
    {
      key: 'top-frame-right',
      material: 'frame',
      debugIgnore: true,
      size: [innerTopFrameThickness, topSectionHeight, glazingFrameDepth],
      position: [sectionWidth / 2 - innerTopFrameThickness / 2, topSectionCenterY, 0],
    },
    {
      key: 'top-frame-top',
      material: 'frame',
      debugIgnore: true,
      size: [topGlassWidth, innerTopFrameThickness, glazingFrameDepth],
      position: [0, topSectionCenterY + topSectionHeight / 2 - innerTopFrameThickness / 2, 0],
    },
    {
      key: 'top-frame-bottom',
      material: 'frame',
      debugIgnore: true,
      size: [topGlassWidth, innerTopFrameThickness, glazingFrameDepth],
      position: [0, topSectionCenterY - topSectionHeight / 2 + innerTopFrameThickness / 2, 0],
    },
    {
      key: 'bottom-panel',
      material: 'frame',
      debugType: 'opening',
      size: [sectionWidth, bottomSectionHeight, panelDepth],
      position: [0, bottomSectionCenterY, panelZ],
    },
    {
      key: 'threshold',
      material: 'frame',
      debugIgnore: true,
      size: [thresholdWidth, thresholdThickness, thresholdDepth],
      position: [
        0,
        -openingHeight / 2 - thresholdThickness / 2 + THRESHOLD_LIFT,
        frameDepth / 2 + thresholdDepth / 2 - SILL_FRAME_CONTACT_DEPTH,
      ],
    },
  ];
}

function createPlanFrontWindowParts(
  openingWidth: number,
  openingHeight: number,
  frameThickness: number,
  frameDepth: number,
  glassInset: number,
  glassThickness: number,
  style: OpeningStyleSpec | undefined
): OpeningRenderPart[] {
  const glassWidth = Math.max(0.01, openingWidth - frameThickness * 2);
  const glassHeight = Math.max(0.01, openingHeight - frameThickness * 2);
  const mullionThickness = clamp(
    style?.mullionWidth ?? frameThickness * 0.9,
    0.012,
    Math.min(glassWidth, glassHeight) * 0.18
  );
  const mullionDepth = clamp(frameDepth * 0.65, glassThickness, frameDepth);
  const mullionOffset = glassInset + glassThickness / 2 + 0.002;
  const transomRatio = clamp(style?.transomRatio ?? 0.3, 0.18, 0.4);
  const transomHeight = Math.max(0.12, glassHeight * transomRatio);
  const lowerHeight = Math.max(0.12, glassHeight - transomHeight - mullionThickness);
  const lowerPaneWidth = Math.max(0.1, (glassWidth - mullionThickness) / 2);
  const lowerCenterY = -glassHeight / 2 + lowerHeight / 2;
  const transomCenterY = glassHeight / 2 - transomHeight / 2;
  const transomCols = Math.max(style?.grid?.cols ?? 5, 3) + 3;
  const transomRows = 2;
  const transomCellWidth = Math.max(
    0.04,
    (glassWidth - mullionThickness * (transomCols - 1)) / transomCols
  );
  const transomCellHeight = Math.max(
    0.04,
    (transomHeight - mullionThickness * (transomRows - 1)) / transomRows
  );

  const parts: OpeningRenderPart[] = [
    {
      key: 'frame-left',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [-openingWidth / 2 + frameThickness / 2, 0, 0],
    },
    {
      key: 'frame-right',
      material: 'frame',
      debugType: 'opening',
      size: [frameThickness, openingHeight, frameDepth],
      position: [openingWidth / 2 - frameThickness / 2, 0, 0],
    },
    {
      key: 'frame-top',
      material: 'frame',
      debugType: 'opening',
      size: [glassWidth, frameThickness, frameDepth],
      position: [0, openingHeight / 2 - frameThickness / 2, 0],
    },
    {
      key: 'frame-bottom',
      material: 'frame',
      debugType: 'opening',
      size: [glassWidth, frameThickness, frameDepth],
      position: [0, -openingHeight / 2 + frameThickness / 2, 0],
    },
    {
      key: 'lower-glass-left',
      material: 'glass',
      debugType: 'opening',
      size: [lowerPaneWidth, lowerHeight, glassThickness],
      position: [-(mullionThickness + lowerPaneWidth) / 2, lowerCenterY, glassInset],
    },
    {
      key: 'lower-glass-right',
      material: 'glass',
      debugType: 'opening',
      size: [lowerPaneWidth, lowerHeight, glassThickness],
      position: [(mullionThickness + lowerPaneWidth) / 2, lowerCenterY, glassInset],
    },
    {
      key: 'lower-center-mullion',
      material: 'frame',
      debugIgnore: true,
      size: [mullionThickness, lowerHeight, mullionDepth],
      position: [0, lowerCenterY, mullionOffset],
    },
    {
      key: 'transom-divider',
      material: 'frame',
      debugIgnore: true,
      size: [glassWidth, mullionThickness, mullionDepth],
      position: [0, lowerCenterY + lowerHeight / 2 + mullionThickness / 2, mullionOffset],
    },
  ];

  for (let row = 0; row < transomRows; row += 1) {
    for (let col = 0; col < transomCols; col += 1) {
      const x =
        -glassWidth / 2 +
        transomCellWidth / 2 +
        col * (transomCellWidth + mullionThickness);
      const y =
        transomCenterY +
        (row === 0 ? transomCellHeight / 2 + mullionThickness / 2 : -transomCellHeight / 2 - mullionThickness / 2);

      parts.push({
        key: `transom-glass-${row}-${col}`,
        material: 'glass',
        debugType: 'opening',
        size: [transomCellWidth, transomCellHeight, glassThickness],
        position: [x, y, glassInset],
      });
    }
  }

  for (let col = 1; col < transomCols; col += 1) {
    const x = -glassWidth / 2 + col * transomCellWidth + (col - 0.5) * mullionThickness;
    parts.push({
      key: `transom-mullion-v-${col - 1}`,
      material: 'frame',
      debugIgnore: true,
      size: [mullionThickness, transomHeight, mullionDepth],
      position: [x, transomCenterY, mullionOffset],
    });
  }

  parts.push({
    key: 'transom-mullion-h-0',
    material: 'frame',
    debugIgnore: true,
    size: [glassWidth, mullionThickness, mullionDepth],
    position: [0, transomCenterY, mullionOffset],
  });

  return parts;
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
    ...(debugFlags.enabled ? { top: true, bottom: true } : {}),
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
  const lintelThickness = Math.max(frameThickness * 1.15, 0.02);
  const lintelDepth = frameDepth;
  const lintelOverhang = Math.max(frameThickness * 0.35, 0.02);
  const shouldRenderSill = options.kind !== 'door' && style?.hasSill !== false;

  if (style?.variant === 'frontPortalDoor') {
    return {
      frameThickness,
      frameDepth,
      glassInset,
      glassThickness,
      originOffsetZ: FRONT_PORTAL_STONE_PROJECTION,
      parts: createFrontPortalDoorParts(
        openingWidth,
        openingHeight,
        frameThickness,
        frameDepth,
        style
      ),
    };
  }

  if (style?.variant === 'doorDetailed') {
    return {
      frameThickness,
      frameDepth,
      glassInset,
      glassThickness,
      parts: createDetailedDoorParts(
        openingWidth,
        openingHeight,
        frameThickness,
        frameDepth,
        glassInset,
        glassThickness
      ),
    };
  }

  if (style?.variant === 'planFrontWindow') {
    const parts = createPlanFrontWindowParts(
      openingWidth,
      openingHeight,
      frameThickness,
      frameDepth,
      glassInset,
      glassThickness,
      style
    );

    if (shouldRenderSill) {
      const sillCenterY = -openingHeight / 2 + sillThickness / 2 + THRESHOLD_LIFT;
      const sillCenterZ =
        frameDepth / 2 + sillDepth / 2 - Math.min(sillProjection, SILL_FRAME_CONTACT_DEPTH);

      parts.push({
        key: 'sill',
        material: 'stone',
        debugIgnore: true,
        size: [openingWidth + sillOverhang * 2, sillThickness, sillDepth],
        position: [0, sillCenterY, sillCenterZ],
      });
    }

    if (style?.hasLintel) {
      const lintelThickness = Math.max(frameThickness * 1.15, 0.02);
      const lintelDepth = frameDepth;
      const lintelOverhang = Math.max(frameThickness * 0.35, 0.02);

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

  if ((style?.separatorPanelHeight ?? 0) > 0) {
    // Separator panels bridge stacked openings by covering the slab face below the
    // upper opening, so their volume needs to hang below the opening baseline.
    const separatorPanelHeight = clamp(
      style?.separatorPanelHeight ?? 0,
      0.01,
      Math.max(openingHeight - topFrameThickness, 0.01)
    );
    const separatorPanelDepth = clamp(frameDepth * 0.45, 0.02, frameDepth);
    const separatorPanelWidth = Math.max(glassWidth, 0.01);
    const separatorPanelCenterY = -openingHeight / 2 - separatorPanelHeight / 2;

    parts.push({
      key: 'separator-panel',
      material: 'frame',
      debugIgnore: true,
      size: [separatorPanelWidth, separatorPanelHeight, separatorPanelDepth],
      position: [
        glassCenterX,
        -openingHeight / 2 - separatorPanelHeight / 2,
        frameDepth / 2 - separatorPanelDepth / 2 - SEPARATOR_PANEL_FRONT_INSET,
      ],
    });

    if (frameEdges.left) {
      parts.push({
        key: 'separator-frame-left',
        material: 'frame',
        debugIgnore: true,
        size: [frameThickness, separatorPanelHeight, frameDepth],
        position: [-openingWidth / 2 + frameThickness / 2, separatorPanelCenterY, 0],
      });
    }

    if (frameEdges.right) {
      parts.push({
        key: 'separator-frame-right',
        material: 'frame',
        debugIgnore: true,
        size: [frameThickness, separatorPanelHeight, frameDepth],
        position: [openingWidth / 2 - frameThickness / 2, separatorPanelCenterY, 0],
      });
    }
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

  if (shouldRenderSill) {
    const sillCenterY = -openingHeight / 2 + sillThickness / 2 + THRESHOLD_LIFT;
    const sillCenterZ =
      frameDepth / 2 + sillDepth / 2 - Math.min(sillProjection, SILL_FRAME_CONTACT_DEPTH);

    parts.push({
      key: 'sill',
      material: 'stone',
      debugIgnore: true,
      size: [openingWidth + sillOverhang * 2, sillThickness, sillDepth],
      position: [0, sillCenterY, sillCenterZ],
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
