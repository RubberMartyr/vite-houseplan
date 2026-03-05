import { useMemo } from 'react';
import type { DebugPanelTabId } from './debugUIState';
import { useDebugUIState } from './debugUIState';
import { RenderingTab } from './tabs/RenderingTab';

type TabDefinition = {
  id: DebugPanelTabId;
  label: string;
};

const tabs: TabDefinition[] = [
  { id: 'rendering', label: 'Rendering' },
];

export function DebugPanel() {
  const isPanelOpen = useDebugUIState((state) => state.isPanelOpen);
  const activeTab = useDebugUIState((state) => state.activeTab);
  const setActiveTab = useDebugUIState((state) => state.setActiveTab);
  const closePanel = useDebugUIState((state) => state.closePanel);

  const activeContent = useMemo(() => {
    if (activeTab === 'rendering') {
      return <RenderingTab />;
    }

    return null;
  }, [activeTab]);

  if (!isPanelOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: '10%',
        background: 'rgba(17, 24, 39, 0.97)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        color: '#f9fafb',
        zIndex: 2200,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <strong>Debug Controls</strong>
        <button type="button" onClick={closePanel} style={{ background: 'transparent', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 0 }}>
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', padding: 12, display: 'grid', gap: 8, alignContent: 'start' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  color: '#f9fafb',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 16, overflow: 'auto' }}>{activeContent}</div>
      </div>
    </div>
  );
}
