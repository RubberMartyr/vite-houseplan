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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.45)',
        background: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function RenderingTab({
  showWireframe,
  onShowWireframeChange,
  showEdges,
  onShowEdgesChange,
  showOpeningEdges,
  onShowOpeningEdgesChange,
}: Props) {
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Rendering</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ToggleRow label="Wireframe mode" checked={showWireframe} onChange={onShowWireframeChange} />
        <ToggleRow label="Show structural edges" checked={showEdges} onChange={onShowEdgesChange} />
        <ToggleRow label="Show opening/frame edges" checked={showOpeningEdges} onChange={onShowOpeningEdgesChange} />
      </div>
    </div>
  );
}
