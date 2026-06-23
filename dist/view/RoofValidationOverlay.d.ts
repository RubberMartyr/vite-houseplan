import type { MultiPlaneRoofValidationResult } from '../engine/validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../engine/types';
type Props = {
    entries: Array<{
        roof: MultiPlaneRoofSpec;
        validation: MultiPlaneRoofValidationResult;
    }>;
    highlightedRidgeId?: string | null;
};
export declare function RoofValidationOverlay({ entries, highlightedRidgeId }: Props): import("react/jsx-runtime").JSX.Element;
export {};
