import type { MultiPlaneRoofValidationResult } from '../validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../types';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import type { ArchitecturalMaterials } from '../architecturalTypes';
type EngineRoofsProps = {
    roofs: DerivedRoof[];
    roofRevision: number;
    roofValidationEntries: Array<{
        roof: MultiPlaneRoofSpec;
        validation: MultiPlaneRoofValidationResult;
    }>;
    visible?: boolean;
    roofMaterialSpec?: ArchitecturalMaterials['roof'];
};
export declare const EngineRoofs: import("react").NamedExoticComponent<EngineRoofsProps>;
export {};
