import { useEffect, useMemo, useState } from 'react';
import type { ArchitecturalHouse } from '../../architecturalTypes';
import { JsonEditorTab } from './tabs/JsonEditorTab';
import { RenderingTab } from './tabs/RenderingTab';

type TabId = 'rendering' | 'json';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  showWireframe: boolean;
  onShowWireframeChange: (enabled: boolean) => void;
  showEdges: boolean;
  onShowEdgesChange: (enabled: boolean) => void;
  showOpeningEdges: boolean;
  onShowOpeningEdgesChange: (enabled: boolean) => void;
  initialJson: string;
  onApplyArchitecturalHouse: (house: ArchitecturalHouse) => void;
};

export function DebugDashboard({
  isOpen,
  onClose,
  showWireframe,
  onShowWireframeChange,
  showEdges,
  onShowEdgesChange,
  showOpeningEdges,
  onShowOpeningEdgesChange,
  initialJson,
  onApplyArchitecturalHouse,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('rendering');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const content = useMemo(() => {
    if (activeTab === 'json') {
      return <JsonEditorTab initialJson={initialJson} onApplyArchitecturalHouse={onApplyArchitecturalHouse} />;
    }

    return (
      <RenderingTab
        showWireframe={showWireframe}
        onShowWireframeChange={onShowWireframeChange}
        showEdges={showEdges}
        onShowEdgesChange={onShowEdgesChange}
        showOpeningEdges={showOpeningEdges}
        onShowOpeningEdgesChange={onShowOpeningEdgesChange}
      />
    );
  }, [
    activeTab,
    initialJson,
    onApplyArchitecturalHouse,
    onShowEdgesChange,
    onShowOpeningEdgesChange,
    onShowWireframeChange,
    showEdges,
    showOpeningEdges,
    showWireframe,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.58)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 2100,
      }}
      onClick={onClose}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '80%',
          height: '80%',
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'rgba(15, 23, 42, 0.97)',
          color: '#f8fafc',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
        }}
      >
        <header style={{ padding: '14px 18px', borderBottom: '1px solid rgba(148, 163, 184, 0.3)', fontWeight: 700 }}>
          HouseViewer Debug Dashboard
        </header>

        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', gap: 8 }}>
          {[
            { id: 'rendering' as const, label: 'Rendering' },
            { id: 'json' as const, label: 'JSON' },
          ].map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${active ? 'rgba(125, 211, 252, 0.8)' : 'rgba(148, 163, 184, 0.45)'}`,
                  background: active ? 'rgba(3, 105, 161, 0.4)' : 'rgba(15, 23, 42, 0.6)',
                  color: '#f8fafc',
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 14, minHeight: 0 }}>{content}</div>
      </section>
    </div>
  );
}
