import React from 'react';

type FacadeKey = 'front' | 'rear' | 'left' | 'right';
type FloorKey = 'basement' | 'ground' | 'first' | 'attic';

type ViewerControlsProps = {
  cutawayEnabled: boolean;
  onToggleCutaway: () => void;
  facadeVisibility: Record<FacadeKey, boolean>;
  onToggleFacade: (key: FacadeKey) => void;
  activeFloors: Record<FloorKey, boolean>;
  allFloorsActive: boolean;
  onToggleFloor: (key: FloorKey) => void;
  onSetAllFloors: () => void;
  showTerrain: boolean;
  onToggleTerrain: () => void;
  showRoof: boolean;
  onToggleRoof: () => void;
  roofWireframe: boolean;
  onToggleRoofWireframe: () => void;
  onBasementView: () => void;
  showLegacy: boolean;
  onToggleLegacy: () => void;
  showWindows: boolean;
  onToggleWindows: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  selectedRoom: { id: string; label: string } | null;
  onClearSelectedRoom: () => void;
};

export function ViewerControls({
  cutawayEnabled,
  onToggleCutaway,
  facadeVisibility,
  onToggleFacade,
  activeFloors,
  allFloorsActive,
  onToggleFloor,
  onSetAllFloors,
  showTerrain,
  onToggleTerrain,
  showRoof,
  onToggleRoof,
  roofWireframe,
  onToggleRoofWireframe,
  onBasementView,
  showLegacy,
  onToggleLegacy,
  showWindows,
  onToggleWindows,
  focusMode,
  onToggleFocusMode,
  selectedRoom,
  onClearSelectedRoom,
}: ViewerControlsProps) {
  const buttonStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #222',
    background: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontWeight: 700,
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 2,
        background: 'rgba(240,240,240,0.9)',
        padding: '10px 12px',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>Cutaway Mode</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              ...buttonStyle,
              background: cutawayEnabled ? '#1d6f42' : buttonStyle.background,
              color: cutawayEnabled ? '#fff' : '#111',
            }}
            onClick={onToggleCutaway}
          >
            {cutawayEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
          {(
            [
              { key: 'front', label: 'Front' },
              { key: 'rear', label: 'Rear' },
              { key: 'left', label: 'Left' },
              { key: 'right', label: 'Right' },
            ] as { key: FacadeKey; label: string }[]
          ).map(({ key, label }) => {
            const isActive = facadeVisibility[key];
            return (
              <button
                key={key}
                style={{
                  ...buttonStyle,
                  background: isActive ? '#8B5A40' : '#ddd',
                  color: isActive ? '#fff' : '#444',
                }}
                onClick={() => onToggleFacade(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>Floor Isolation</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        {(
          [
            { key: 'basement', label: 'Basement' },
            { key: 'ground', label: 'Ground' },
            { key: 'first', label: 'First' },
            { key: 'attic', label: 'Attic' },
          ] as { key: FloorKey; label: string }[]
        ).map(({ key, label }) => {
          const isActive = activeFloors[key];
          return (
            <button
              key={key}
              style={{
                ...buttonStyle,
                background: isActive ? '#8B5A40' : buttonStyle.background,
                color: isActive ? '#fff' : '#111',
                width: '100%',
              }}
              onClick={() => onToggleFloor(key)}
            >
              {label}
            </button>
          );
        })}
        <button
          style={{
            ...buttonStyle,
            background: allFloorsActive ? '#1d6f42' : buttonStyle.background,
            color: allFloorsActive ? '#fff' : '#111',
            width: '100%',
          }}
          onClick={onSetAllFloors}
        >
          All
        </button>
      </div>

      <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>Site View</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <button
          style={{
            ...buttonStyle,
            background: showTerrain ? '#8B5A40' : buttonStyle.background,
            color: showTerrain ? '#fff' : '#111',
            width: '100%',
          }}
          onClick={onToggleTerrain}
        >
          Ground
        </button>
        <button
          style={{
            ...buttonStyle,
            background: showRoof ? '#1d6f42' : buttonStyle.background,
            color: showRoof ? '#fff' : '#111',
            width: '100%',
          }}
          onClick={onToggleRoof}
        >
          {showRoof ? 'Roof: ON' : 'Roof: OFF'}
        </button>
        <button
          style={{
            ...buttonStyle,
            background: roofWireframe ? '#8B5A40' : buttonStyle.background,
            color: roofWireframe ? '#fff' : '#111',
            width: '100%',
          }}
          onClick={onToggleRoofWireframe}
        >
          Roof Style: {roofWireframe ? 'Wireframe' : 'Black'}
        </button>
        <button style={{ ...buttonStyle, width: '100%' }} onClick={onBasementView}>
          Basement View
        </button>

        <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>
          Rendering
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            style={{
              ...buttonStyle,
              background: showLegacy ? '#1d6f42' : buttonStyle.background,
              color: showLegacy ? '#fff' : '#111',
              width: '100%',
            }}
            onClick={onToggleLegacy}
          >
            {showLegacy ? 'Legacy: ON' : 'Legacy: OFF'}
          </button>

          <button
            style={{
              ...buttonStyle,
              background: showWindows ? '#8B5A40' : buttonStyle.background,
              color: showWindows ? '#fff' : '#111',
              width: '100%',
            }}
            onClick={onToggleWindows}
          >
            {showWindows ? 'Windows: ON' : 'Windows: OFF'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>Room Focus</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              ...buttonStyle,
              background: focusMode ? '#1d6f42' : buttonStyle.background,
              color: focusMode ? '#fff' : '#111',
            }}
            onClick={onToggleFocusMode}
          >
            {focusMode ? 'Focus ON' : 'Focus OFF'}
          </button>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontWeight: 700 }}>Selected Room</span>
          {selectedRoom ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>{selectedRoom.label}</span>
              <code style={{ fontSize: 12 }}>{selectedRoom.id}</code>
            </div>
          ) : (
            <span style={{ color: '#555' }}>Tap a room to select it</span>
          )}
          <button style={{ ...buttonStyle, alignSelf: 'flex-start' }} onClick={onClearSelectedRoom} disabled={!selectedRoom}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
