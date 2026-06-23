export type DebugPanelTabId = 'rendering';
type DebugUIState = {
    isPanelOpen: boolean;
    activeTab: DebugPanelTabId;
    debugWireframe: boolean;
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
    setActiveTab: (tab: DebugPanelTabId) => void;
    setDebugWireframe: (enabled: boolean) => void;
};
export declare const useDebugUIState: import("zustand").UseBoundStore<DebugUIState, import("zustand").StoreApi<DebugUIState>>;
export {};
