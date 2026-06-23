import type { DerivedRoof } from '../derive/types/DerivedRoof';
import type { ArchitecturalMaterials } from '../architecturalTypes';
type Props = {
    roofs: DerivedRoof[];
    roofRevision: number;
    visible?: boolean;
    roofMaterialSpec?: ArchitecturalMaterials['roof'];
};
export declare function EngineFlatRoofs({ roofs, roofRevision, visible, roofMaterialSpec }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
