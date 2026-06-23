import type { ArchitecturalHouse } from '../architecturalTypes';
import type { FloorplanValidationResult } from '../validation/validateFloorplan';
type Props = {
    architecturalHouse: ArchitecturalHouse;
    validationResult: FloorplanValidationResult | null;
    showFloorplanOverlay: boolean;
    showValidationIssues: boolean;
};
export declare function FloorplanValidationOverlay({ architecturalHouse, validationResult, showFloorplanOverlay, showValidationIssues, }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
