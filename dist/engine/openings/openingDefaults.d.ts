import type { OpeningStyleSpec } from '../architecturalTypes';
export type NormalizedOpeningStyleCore = Required<Pick<OpeningStyleSpec, 'frameThickness' | 'frameDepth' | 'glassInset' | 'glassThickness'>>;
export declare const DEFAULT_FRAME_EDGES: NonNullable<OpeningStyleSpec['frameEdges']>;
export declare const DEFAULT_OPENING_STYLE: NormalizedOpeningStyleCore;
