import type { Vec2 } from '../architecturalTypes';
import { type DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { ArchitecturalMaterials } from '../architecturalTypes';
type EngineWallsProps = {
    walls: DerivedWallSegment[];
    openings: DerivedOpening[];
    wallRevision: number;
    openingsRevision: number;
    levelFootprintsById?: Record<string, Vec2[]>;
    visible?: boolean;
    wallMaterialSpec?: ArchitecturalMaterials['walls'];
    cacheKey?: string;
};
export declare const EngineWalls: import("react").NamedExoticComponent<EngineWallsProps>;
export {};
