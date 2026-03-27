export type ValidationLogEntry = {
  level: 'error' | 'info';
  message: string;
};

type Props = {
  showWireframe: boolean;
  onShowWireframeChange: (enabled: boolean) => void;
  showEdges: boolean;
  onShowEdgesChange: (enabled: boolean) => void;
  showOpeningEdges: boolean;
  onShowOpeningEdgesChange: (enabled: boolean) => void;
  onValidateFloorplan: () => void;
  validationLog?: ValidationLogEntry[];
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
  onValidateFloorplan,
  validationLog = [],
}: Props) {
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Rendering</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ToggleRow label="Wireframe mode" checked={showWireframe} onChange={onShowWireframeChange} />
        <ToggleRow label="Show structural edges" checked={showEdges} onChange={onShowEdgesChange} />
        <ToggleRow
          label="Show opening/frame edges"
          checked={showOpeningEdges}
          onChange={onShowOpeningEdgesChange}
        />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <button
          type="button"
          onClick={onValidateFloorplan}
          style={{
            justifySelf: 'start',
            borderRadius: 8,
            border: '1px solid rgba(125, 211, 252, 0.8)',
            background: 'rgba(3, 105, 161, 0.35)',
            color: '#f8fafc',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Validate floorplan
        </button>

        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(2, 6, 23, 0.55)',
            padding: 10,
            minHeight: 80,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {(validationLog.length === 0 ? [{ level: 'info', message: 'No validation runs yet.' }] : validationLog).map((entry, index) => {
            const tone = entry.level === 'error' ? '#fca5a5' : '#86efac';
            const label = entry.level === 'error' ? 'Error' : 'OK';

            return (
              <div key={`${entry.message}-${index}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: tone, fontWeight: 700, minWidth: 46 }}>{label}</span>
                <span>{entry.message}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
