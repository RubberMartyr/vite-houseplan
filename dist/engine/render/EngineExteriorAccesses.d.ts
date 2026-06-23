import type { ArchitecturalMaterials } from '../architecturalTypes';
import type { DerivedExteriorAccessPart } from '../derive/types/DerivedExteriorAccess';
type EngineExteriorAccessesProps = {
    parts: DerivedExteriorAccessPart[];
    visible?: boolean;
    wallMaterialSpec?: ArchitecturalMaterials['walls'];
};
export declare function EngineExteriorAccesses({ parts, visible, wallMaterialSpec, }: EngineExteriorAccessesProps): import("react/jsx-runtime").JSX.Element | null;
export {};
