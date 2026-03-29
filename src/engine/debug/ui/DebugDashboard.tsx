import React, { useEffect, useState, type ReactNode } from 'react';
import type { ArchitecturalHouse } from '../../architecturalTypes';
import { FloorplanValidationTab } from './tabs/FloorplanValidationTab';
import { JsonEditorTab } from './tabs/JsonEditorTab';
import { RenderingTab, type ValidationLogEntry } from './tabs/RenderingTab';
import { VisibilityTab, type VisibilityState } from './tabs/VisibilityTab';

type TabId = 'rendering' | 'floorplan-validation' | 'visibility' | 'json';

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
  onRunFloorplanValidation: () => void;
  showFloorplanOverlay: boolean;
  onShowFloorplanOverlayChange: (enabled: boolean) => void;
  showValidationIssues: boolean;
  onShowValidationIssuesChange: (enabled: boolean) => void;
  onClearValidationOutput: () => void;
  validationLog?: ValidationLogEntry[];
  visibility: VisibilityState;
  onVisibilityChange: (nextVisibility: VisibilityState) => void;
};

type DebugBoundaryProps = {
  children: ReactNode;
};

type DebugBoundaryState = {
  errorMessage: string | null;
};

class DebugContentBoundary extends React.Component<DebugBoundaryProps, DebugBoundaryState> {
  state: DebugBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: unknown): DebugBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown debug panel error.';
    return { errorMessage: message };
  }

  componentDidCatch() {
    // Keep failure visible in-panel instead of blanking the overlay.
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(252, 165, 165, 0.55)',
            background: 'rgba(127, 29, 29, 0.2)',
            color: '#fecaca',
            padding: 12,
          }}
        >
          Debug panel failed to render: {this.state.errorMessage}
        </div>
      );
    }

    return this.props.children;
  }
}

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
  onRunFloorplanValidation,
  showFloorplanOverlay,
  onShowFloorplanOverlayChange,
  showValidationIssues,
  onShowValidationIssuesChange,
  onClearValidationOutput,
  validationLog = [],
  visibility,
  onVisibilityChange,
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
            { id: 'floorplan-validation' as const, label: 'Floor Plan Validation' },
            { id: 'visibility' as const, label: 'Visibility' },
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

        <div style={{ padding: 14, minHeight: 0 }}>
          <DebugContentBoundary>
            {activeTab === 'json' ? (
              <JsonEditorTab initialJson={initialJson} onApplyArchitecturalHouse={onApplyArchitecturalHouse} />
            ) : activeTab === 'rendering' ? (
              <RenderingTab
                showWireframe={showWireframe}
                onShowWireframeChange={onShowWireframeChange}
                showEdges={showEdges}
                onShowEdgesChange={onShowEdgesChange}
                showOpeningEdges={showOpeningEdges}
                onShowOpeningEdgesChange={onShowOpeningEdgesChange}
              />
            ) : activeTab === 'floorplan-validation' ? (
              <FloorplanValidationTab
                onRunFloorplanValidation={onRunFloorplanValidation}
                showFloorplanOverlay={showFloorplanOverlay}
                onShowFloorplanOverlayChange={onShowFloorplanOverlayChange}
                showValidationIssues={showValidationIssues}
                onShowValidationIssuesChange={onShowValidationIssuesChange}
                onClearValidationOutput={onClearValidationOutput}
                validationLog={validationLog}
              />
            ) : (
              <VisibilityTab visibility={visibility} onVisibilityChange={onVisibilityChange} />
            )}
          </DebugContentBoundary>
        </div>
      </section>
    </div>
  );
}
