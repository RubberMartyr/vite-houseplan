import type { ArchitecturalHouse, Footprint } from '../types';
export type DerivedSlabKind = 'floor' | 'roof-bearing';
export interface DerivedSlab {
    id: string;
    kind: DerivedSlabKind;
    levelId: string;
    levelIndex: number;
    elevationTop: number;
    elevationBottom: number;
    footprint: Footprint;
    inset: number;
}
export declare function deriveSlabs(house: ArchitecturalHouse): DerivedSlab[];
