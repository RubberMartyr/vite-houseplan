import { useDebugUIState } from './debugUIState';

export function DebugButton() {
  const togglePanel = useDebugUIState((state) => state.togglePanel);

  return (
    <button
      type="button"
      onClick={togglePanel}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: '#111827',
        color: '#f9fafb',
        fontSize: 24,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
        zIndex: 2000,
      }}
      aria-label="Toggle debug panel"
      title="Debug"
    >
      🛠
    </button>
  );
}
