import type { OpeningStyleSpec } from '../architecturalTypes';

const leftFacadeFamilyFrameThickness = 0.06;

export const frontGroundTallWindow: OpeningStyleSpec = {
  variant: 'planFrontWindow',
  grid: { cols: 2, rows: 4 },
  rowFractions: [0.2, 0.266, 0.266, 0.268],
  hasSill: true,
  hasLintel: true,
};

export const frontFirstTallWindow: OpeningStyleSpec = {
  variant: 'firstFloorTransom',
  grid: { cols: 2, rows: 4 },
  rowFractions: [0.2, 0.266, 0.266, 0.268],
  hasSill: true,
  hasLintel: true,
};

export const frontDormerWindow: OpeningStyleSpec = {
  variant: 'plain',
  grid: { cols: 2, rows: 3 },
  rowFractions: [0.28, 0.36, 0.36],
  frameThickness: 0.09,
  frameDepth: 0.14,
  glassInset: 0.01,
  glassThickness: 0.012,
  mullionWidth: 0.055,
  hasSill: false,
  hasLintel: false,
};

export const frontSmallWindow: OpeningStyleSpec = {
  variant: 'plain',
  grid: { cols: 2, rows: 3 },
  rowFractions: [0.28, 0.36, 0.36],
  hasSill: true,
  hasLintel: true,
};

export const leftFacadeTallLowerWindow: OpeningStyleSpec = {
  variant: 'plain',
  hasSill: true,
  hasLintel: false,
  frameThickness: leftFacadeFamilyFrameThickness,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
  frameEdges: { top: false },
};

export const leftFacadeTallUpperWindow: OpeningStyleSpec = {
  ...leftFacadeTallLowerWindow,
  hasSill: false,
  hasLintel: true,
  mergeWithBelow: true,
  separatorPanelHeight: 0.25,
  frameEdges: { bottom: false },
};

export const leftFacadeShortWindow: OpeningStyleSpec = {
  variant: 'plain',
  hasSill: true,
  hasLintel: true,
  frameThickness: leftFacadeFamilyFrameThickness,
  frameDepth: 0.1,
  glassInset: 0.012,
  glassThickness: 0.012,
};

export const plainWindow: OpeningStyleSpec = {
  variant: 'plain',
  grid: { cols: 1, rows: 1 },
  hasSill: true,
  hasLintel: true,
};

export const firstFloorTransom: OpeningStyleSpec = {
  variant: 'firstFloorTransom',
  grid: { cols: 2, rows: 1 },
  hasSill: true,
  hasLintel: true,
};

export const doorDetailed: OpeningStyleSpec = {
  variant: 'doorDetailed',
  hasSill: false,
  hasLintel: true,
  surroundRing: true,
};

export const frontPortalDoor: OpeningStyleSpec = {
  variant: 'frontPortalDoor',
  frameThickness: 0.065,
  frameDepth: 0.14,
  transomRatio: 0.25,
  hasSill: false,
  hasLintel: false,
  surroundRing: true,
};
