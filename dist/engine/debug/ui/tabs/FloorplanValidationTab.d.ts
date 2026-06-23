import type { ValidationLogEntry } from './RenderingTab';
type Props = {
    onRunFloorplanValidation: () => void;
    showFloorplanOverlay: boolean;
    onShowFloorplanOverlayChange: (enabled: boolean) => void;
    showValidationIssues: boolean;
    onShowValidationIssuesChange: (enabled: boolean) => void;
    onClearValidationOutput: () => void;
    validationLog?: ValidationLogEntry[];
};
export declare function FloorplanValidationTab({ onRunFloorplanValidation, showFloorplanOverlay, onShowFloorplanOverlayChange, showValidationIssues, onShowValidationIssuesChange, onClearValidationOutput, validationLog, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
