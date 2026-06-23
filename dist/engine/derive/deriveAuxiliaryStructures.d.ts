import type { ArchitecturalHouse, SiteSpec } from '../architecturalTypes';
import type { DerivedRoof } from './types/DerivedRoof';
import type { DerivedCarport } from './types/DerivedCarport';
type DeriveAuxiliaryStructuresContext = {
    roofs: DerivedRoof[];
    site?: SiteSpec;
};
export declare function deriveAuxiliaryStructures(arch: ArchitecturalHouse, context: DeriveAuxiliaryStructuresContext): DerivedCarport[];
export {};
