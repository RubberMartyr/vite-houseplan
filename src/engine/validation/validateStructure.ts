export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  severity: ValidationSeverity;
  code:
    | 'LEVEL_FLOATING'
    | 'SLAB_MISSING'
    | 'SLAB_FLOATING'
    | 'WALL_FLOATING'
    | 'LEVEL_ORDER_INVALID'
    | 'LEVEL_GAP_UNSUPPORTED';
  message: string;
  levelIndex?: number;
  details?: Record<string, unknown>;
};

export type ValidationReport = {
  ok: boolean;
  issues: ValidationIssue[];
};

export class ValidationError extends Error {
  public report: ValidationReport;

  constructor(report: ValidationReport) {
    super(report.issues.map((i) => i.message).join('\n'));
    this.name = 'ValidationError';
    this.report = report;
  }
}

/**
 * Adapter so this validator can work with *your* engine types without guessing.
 * Implement these methods using your house model.
 */
export type HouseValidationAdapter<House> = {
  getLevels(house: House): unknown[];

  // Level properties
  getLevelElevation(level: unknown, index: number): number; // meters
  getLevelHeight(level: unknown, index: number): number; // meters

  // Slab properties (return null/undefined if level has no slab)
  getSlabThickness(level: unknown, index: number): number | null;

  /**
   * Defines what "elevation" means in your engine.
   * Choose ONE convention and keep it consistent:
   *
   * - 'TOP_OF_SLAB': level.elevation is finished floor / top of structural slab
   * - 'BOTTOM_OF_SLAB': level.elevation is bottom of slab
   */
  elevationConvention: 'TOP_OF_SLAB' | 'BOTTOM_OF_SLAB';

  /**
   * If you allow the ground level slab to be supported by ground (i.e. no below-level needed).
   * Usually true.
   */
  allowGroundSupport: boolean;

  /**
   * If true, enforce that levels are sorted by elevation ascending.
   * Recommended true.
   */
  enforceSortedLevels?: boolean;

  /**
   * Optional: allow "unsupported gaps" (e.g. stilts, pilotis) per level.
   * If not provided, gaps are errors by default.
   */
  isSupportGapAllowed?: (house: House, levelIndex: number) => boolean;
};

export type ValidateOptions = {
  eps?: number; // tolerance in meters
  mode?: 'throw' | 'report'; // default 'throw'
};

function near(a: number, b: number, eps: number) {
  return Math.abs(a - b) <= eps;
}

function slabTop(elevation: number, thickness: number, convention: 'TOP_OF_SLAB' | 'BOTTOM_OF_SLAB') {
  return convention === 'TOP_OF_SLAB' ? elevation : elevation + thickness;
}

function slabBottom(elevation: number, thickness: number, convention: 'TOP_OF_SLAB' | 'BOTTOM_OF_SLAB') {
  return convention === 'TOP_OF_SLAB' ? elevation - thickness : elevation;
}

/**
 * Validates “no floating slabs / walls” using only your structural model.
 * - Ensures each level has slab if walls are expected.
 * - Ensures slab is supported by either ground or previous level’s top-of-walls.
 * - Ensures walls start at slab top (or your chosen convention), not floating.
 */
export function validateStructure<House>(
  house: House,
  adapter: HouseValidationAdapter<House>,
  options: ValidateOptions = {}
): ValidationReport {
  const eps = options.eps ?? 0.002; // 2mm default tolerance
  const mode = options.mode ?? 'throw';

  const issues: ValidationIssue[] = [];
  const levels = adapter.getLevels(house);

  if (adapter.enforceSortedLevels ?? true) {
    for (let i = 1; i < levels.length; i++) {
      const prevE = adapter.getLevelElevation(levels[i - 1], i - 1);
      const curE = adapter.getLevelElevation(levels[i], i);
      if (curE + eps < prevE) {
        issues.push({
          severity: 'error',
          code: 'LEVEL_ORDER_INVALID',
          levelIndex: i,
          message: `Levels are not sorted by elevation: level ${i - 1} elevation=${prevE} > level ${i} elevation=${curE}.`,
          details: { prevE, curE, eps },
        });
      }
    }
  }

  // Validate each level’s slab presence + support.
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const elevation = adapter.getLevelElevation(level, i);
    const height = adapter.getLevelHeight(level, i);
    const thickness = adapter.getSlabThickness(level, i);

    // 1) Slab must exist (strict structural guarantee)
    if (thickness == null || !Number.isFinite(thickness) || thickness <= 0) {
      issues.push({
        severity: 'error',
        code: 'SLAB_MISSING',
        levelIndex: i,
        message: `Level ${i} is missing a valid slab thickness (got ${String(thickness)}).`,
        details: { elevation, height, thickness },
      });
      // If slab missing, many checks can't be trusted; continue to collect more issues though.
      continue;
    }

    const top = slabTop(elevation, thickness, adapter.elevationConvention);
    const bottom = slabBottom(elevation, thickness, adapter.elevationConvention);

    // 2) Slab support: ground or previous level's top-of-walls
    if (i === 0) {
      if (!adapter.allowGroundSupport) {
        issues.push({
          severity: 'error',
          code: 'SLAB_FLOATING',
          levelIndex: i,
          message: 'Ground level (level 0) slab is not allowed to be ground-supported by configuration.',
          details: { elevation, top, bottom },
        });
      }
    } else {
      const below = levels[i - 1];
      const belowElevation = adapter.getLevelElevation(below, i - 1);
      const belowHeight = adapter.getLevelHeight(below, i - 1);
      const expectedSupportPlane = belowElevation + belowHeight; // top of walls below

      const supportGapAllowed = adapter.isSupportGapAllowed?.(house, i) ?? false;

      // We treat "supported" as: slab bottom sits on expectedSupportPlane (or slab top depending on convention).
      // Most structural logic: bottom of slab rests on top of walls.
      const slabSupportPlane = bottom;

      if (!near(slabSupportPlane, expectedSupportPlane, eps)) {
        const gap = slabSupportPlane - expectedSupportPlane;

        if (!supportGapAllowed) {
          issues.push({
            severity: 'error',
            code: 'SLAB_FLOATING',
            levelIndex: i,
            message: `Level ${i} slab appears unsupported/floating. Expected slab bottom ≈ top of walls below (${expectedSupportPlane.toFixed(
              3
            )}), got ${slabSupportPlane.toFixed(3)} (gap ${gap.toFixed(3)}m).`,
            details: {
              expectedSupportPlane,
              slabSupportPlane,
              gap,
              below: { elevation: belowElevation, height: belowHeight },
              thisLevel: { elevation, height, thickness, top, bottom },
              eps,
            },
          });
        } else {
          issues.push({
            severity: 'warning',
            code: 'LEVEL_GAP_UNSUPPORTED',
            levelIndex: i,
            message: `Level ${i} slab support gap detected (gap ${gap.toFixed(
              3
            )}m) but allowed by isSupportGapAllowed().`,
            details: { expectedSupportPlane, slabSupportPlane, gap, eps },
          });
        }
      }
    }

    // 3) Wall support check (generic):
    // In a strict system, walls of level i should start at slab top of level i.
    // We can’t inspect your derived walls here, so we enforce the *structural contract*:
    // "If a level exists, its walls must be derivable from (slab top, footprint, height)".
    // That means slab top must be finite and consistent.
    if (!Number.isFinite(top)) {
      issues.push({
        severity: 'error',
        code: 'WALL_FLOATING',
        levelIndex: i,
        message: `Level ${i} slab top is not a finite number; walls would be floating/invalid.`,
        details: { elevation, thickness, top },
      });
    }

    // Optional extra: ensure the level height isn't absurd (prevents accidental floating/gaps)
    if (!Number.isFinite(height) || height <= 0) {
      issues.push({
        severity: 'error',
        code: 'LEVEL_FLOATING',
        levelIndex: i,
        message: `Level ${i} has invalid height (got ${String(height)}).`,
        details: { elevation, height },
      });
    }
  }

  const report: ValidationReport = { ok: issues.every((i) => i.severity !== 'error'), issues };

  if (mode === 'throw' && !report.ok) {
    throw new ValidationError(report);
  }

  return report;
}
