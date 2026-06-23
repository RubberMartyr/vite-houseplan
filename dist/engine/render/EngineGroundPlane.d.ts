import type { DerivedExteriorAccessCutout } from '../derive/types/DerivedExteriorAccess';
type EngineGroundPlaneProps = {
    cutouts: DerivedExteriorAccessCutout[];
    visible?: boolean;
    size?: number;
};
export declare function EngineGroundPlane({ cutouts, visible, size }: EngineGroundPlaneProps): import("react/jsx-runtime").JSX.Element | null;
export {};
