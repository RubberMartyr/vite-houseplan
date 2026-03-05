import create from 'zustand';

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

export const useDebugUIState = create<DebugUIState>((set) => ({
  isPanelOpen: false,
  activeTab: 'rendering',
  debugWireframe: false,
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setDebugWireframe: (debugWireframe) => set({ debugWireframe }),
}));
