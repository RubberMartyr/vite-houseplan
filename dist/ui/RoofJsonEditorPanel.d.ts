import type { MultiPlaneRoofSpec, RoofSpec } from '../engine/types';
import { type MultiPlaneRoofValidationResult } from '../engine/validation/validateMultiPlaneRoof';
type RoofValidationEntry = {
    roof: MultiPlaneRoofSpec;
    validation: MultiPlaneRoofValidationResult;
};
type Props = {
    isOpen: boolean;
    onClose: () => void;
    roofsValue: unknown;
    validationEntries: RoofValidationEntry[];
    onDebouncedValidate: (entries: RoofValidationEntry[]) => void;
    onHoverRidge?: (ridgeId: string | null) => void;
    onApply: (nextRoofs: RoofSpec[]) => void;
};
export declare function RoofJsonEditorPanel({ isOpen, onClose, roofsValue, validationEntries, onDebouncedValidate, onHoverRidge, onApply }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
