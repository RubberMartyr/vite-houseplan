import type { OpeningStyleSpec } from '../../architecturalTypes';
export declare function normalizeOpeningStyle(style: OpeningStyleSpec | undefined): Required<Pick<OpeningStyleSpec, 'frameThickness' | 'frameDepth' | 'glassInset' | 'glassThickness'>> & OpeningStyleSpec;
