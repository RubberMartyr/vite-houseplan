import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { ArchitecturalMaterials } from '../architecturalTypes';
type Props = {
    openings: DerivedOpeningRect[];
    wallThickness?: number;
    visible?: boolean;
    windowsMaterialSpec?: ArchitecturalMaterials['windows'];
};
export declare const EngineOpenings: import("react").NamedExoticComponent<Props>;
export {};
