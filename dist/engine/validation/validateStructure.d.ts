export type ValidationSeverity = 'error' | 'warning';
export type ValidationIssue = {
    severity: ValidationSeverity;
    code: 'LEVEL_FLOATING' | 'SLAB_MISSING' | 'SLAB_FLOATING' | 'WALL_FLOATING' | 'WALL_TOP_MISALIGNED' | 'LEVEL_ORDER_INVALID' | 'LEVEL_GAP_UNSUPPORTED';
    message: string;
    levelIndex?: number;
    details?: Record<string, unknown>;
};
export type ValidationReport = {
    ok: boolean;
    issues: ValidationIssue[];
};
export declare class ValidationError extends Error {
    report: ValidationReport;
    constructor(report: ValidationReport);
}
/**
 * Adapter so this validator can work with *your* engine types without guessing.
 * Implement these methods using your house model.
 */
export type HouseValidationAdapter<House> = {
    getLevels(house: House): unknown[];
    getLevelElevation(level: unknown, index: number): number;
    getLevelHeight(level: unknown, index: number): number;
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
    eps?: number;
    mode?: 'throw' | 'report';
};
/**
 * Validates “no floating slabs / walls” using only your structural model.
 * - Ensures each level has slab if walls are expected.
 * - Ensures slab is supported by either ground or previous level’s top-of-walls.
 * - Ensures walls start at slab top (or your chosen convention), not floating.
 */
export declare function validateStructure<House>(house: House, adapter: HouseValidationAdapter<House>, options?: ValidateOptions): ValidationReport;
