import type { ArchitecturalHouse, SiteSpec } from '../architecturalTypes';
import type { DerivedHouse } from './types/DerivedHouse';
export declare function deriveHouse(arch: ArchitecturalHouse, options?: {
    site?: SiteSpec;
}): DerivedHouse;
