import type { XZ } from '../architecturalTypes';
export declare function openRing(ring: XZ[]): XZ[];
export declare function findEdgeIndexAtZ(ring: XZ[], zTarget: number, eps?: number): number | null;
export declare function findFacadeEdgeIndex(ring: XZ[], which: 'minZ' | 'maxZ'): number;
