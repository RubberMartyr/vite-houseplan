type FacadeKey = 'front' | 'rear' | 'left' | 'right';
type ViewerControlsProps = {
    cutawayEnabled: boolean;
    onToggleCutaway: () => void;
    facadeVisibility: Record<FacadeKey, boolean>;
    onToggleFacade: (key: FacadeKey) => void;
    activeFloors: Record<string, boolean>;
    allFloorsActive: boolean;
    onToggleFloor: (key: string) => void;
    onSetAllFloors: () => void;
    levelOptions?: {
        key: string;
        label: string;
    }[];
    showTerrain: boolean;
    onToggleTerrain: () => void;
    showRoof: boolean;
    onToggleRoof: () => void;
    roofWireframe: boolean;
    onToggleRoofWireframe: () => void;
    onBasementView: () => void;
    showWindows: boolean;
    onToggleWindows: () => void;
    focusMode: boolean;
    onToggleFocusMode: () => void;
    selectedRoom: {
        id: string;
        label: string;
    } | null;
    onClearSelectedRoom: () => void;
};
export declare function ViewerControls({ cutawayEnabled, onToggleCutaway, facadeVisibility, onToggleFacade, activeFloors, allFloorsActive, onToggleFloor, onSetAllFloors, levelOptions, showTerrain, onToggleTerrain, showRoof, onToggleRoof, roofWireframe, onToggleRoofWireframe, onBasementView, showWindows, onToggleWindows, focusMode, onToggleFocusMode, selectedRoom, onClearSelectedRoom, }: ViewerControlsProps): import("react/jsx-runtime").JSX.Element;
export {};
