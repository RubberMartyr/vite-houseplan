import type { WallPieceRect } from '../openings/splitWallByOpenings';
export declare const SEPARATOR_DEBUG_MIN_HEIGHT = 0.05;
export declare const SEPARATOR_DEBUG_MAX_HEIGHT = 0.4;
export type SeparatorDebugMetadata = {
    wallId: string;
    pieceId?: string;
    stage: string;
    vMin: number;
    vMax: number;
    height: number;
    uMin?: number;
    uMax?: number;
    [key: string]: unknown;
};
export declare function isSeparatorCandidatePiece(piece: Pick<WallPieceRect, 'vMin' | 'vMax'>): boolean;
export declare function createSeparatorDebugMetadata(stage: string, wallId: string, piece: WallPieceRect, extras?: Omit<SeparatorDebugMetadata, 'stage' | 'wallId' | 'vMin' | 'vMax' | 'height' | 'uMin' | 'uMax'>): SeparatorDebugMetadata;
export declare function logSeparatorDebug(enabled: boolean, metadata: SeparatorDebugMetadata): void;
