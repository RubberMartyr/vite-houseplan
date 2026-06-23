export type ValidationLogEntry = {
    level: 'error' | 'warn' | 'info';
    message: string;
};
type Props = {
    showWireframe: boolean;
    onShowWireframeChange: (enabled: boolean) => void;
    showEdges: boolean;
    onShowEdgesChange: (enabled: boolean) => void;
    showOpeningEdges: boolean;
    onShowOpeningEdgesChange: (enabled: boolean) => void;
};
export declare function RenderingTab({ showWireframe, onShowWireframeChange, showEdges, onShowEdgesChange, showOpeningEdges, onShowOpeningEdgesChange, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
