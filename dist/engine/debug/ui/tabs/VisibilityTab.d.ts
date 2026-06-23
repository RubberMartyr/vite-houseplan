type VisibilityState = {
    showSlabs: boolean;
    showWindows: boolean;
    showWalls: boolean;
    showRooms: boolean;
    showRoof: boolean;
};
type Props = {
    visibility: VisibilityState;
    onVisibilityChange: (nextVisibility: VisibilityState) => void;
};
export declare function VisibilityTab({ visibility, onVisibilityChange }: Props): import("react/jsx-runtime").JSX.Element;
export type { VisibilityState };
