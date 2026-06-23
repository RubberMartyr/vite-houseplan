import type { DerivedRoof } from '../derive/types/DerivedRoof';
import type { ArchitecturalMaterials } from '../architecturalTypes';
type Props = {
    roofs: DerivedRoof[];
    roofRevision: number;
    visible?: boolean;
    invalidRoofIds?: Set<string>;
    roofMaterialSpec?: ArchitecturalMaterials['roof'];
};
export declare function EngineGableRoofs({ roofs, roofRevision, visible, invalidRoofIds, roofMaterialSpec, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
